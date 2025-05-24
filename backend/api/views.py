from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import F, ExpressionWrapper, fields, Avg
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import Problem, Submission
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    ProblemListSerializer,
    ProblemDetailSerializer,
    ProblemAdminSerializer,
    SubmissionCreateSerializer,
    SubmissionResultSerializer,
    SubmissionDetailSerializer
)
from .code_runner_service import execute_code, ExecutionResult

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of a submission or admins to view it.
    """
    def has_object_permission(self, request, view, obj):
        # Admins can access all submissions
        if request.user.is_staff:
            return True
        # Owner can access their own submissions
        return obj.user == request.user


class RegisterView(APIView):
    """
    API endpoint for user registration.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows users to be viewed.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


class ProblemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for problems.
    Admin users can create/update/delete problems.
    Regular users can only view problems.
    Sensitive data (reference_solutions, harness_eval_files) is only accessible to admins.
    """
    queryset = Problem.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        """
        Use different serializers based on user type and action
        """
        if self.request.user.is_staff:
            return ProblemAdminSerializer
        if self.action == 'list':
            # Use the detail serializer when filtering by slug
            if 'slug' in self.request.query_params:
                return ProblemDetailSerializer
            return ProblemListSerializer
        return ProblemDetailSerializer
    
    def get_queryset(self):
        """
        Filter problems by tags, difficulty, or search term if specified in query params.
        Also, filter by 'enabled' status based on user role.
        """
        queryset = super().get_queryset() # Use Problem.objects.all() by default

        # Filter by tag (single tag)
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty__iexact=difficulty)
        
        # Filter by slug
        slug = self.request.query_params.get('slug', None)
        if slug:
            queryset = queryset.filter(slug=slug)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
            
        # Filter by 'enabled' status based on user role
        # Allow anonymous users (if any) to also see only enabled problems
        if not self.request.user.is_authenticated or \
           (self.request.user.is_authenticated and not self.request.user.is_staff):
            queryset = queryset.filter(enabled=True)

        # Handle sorting
        sort_by = self.request.query_params.get('sort_by', 'title')
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        
        # Validate sort_by field to prevent SQL injection
        allowed_sort_fields = {'title', 'difficulty', 'created_at'}
        if sort_by not in allowed_sort_fields:
            sort_by = 'title'
            
        # Apply sorting
        if sort_direction == 'desc':
            queryset = queryset.order_by(f'-{sort_by}')
        else:
            queryset = queryset.order_by(sort_by)
            
        return queryset.distinct()


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for submissions.
    Users can create submissions and view their own submissions.
    Admins can view all submissions.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """
        Return all submissions for admins, or just the user's own submissions.
        Allows filtering by problem_id query parameter.
        """
        user = self.request.user
        queryset = Submission.objects.all()

        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        problem_id = self.request.query_params.get('problem_id', None)
        if problem_id is not None:
            try:
                queryset = queryset.filter(problem_id=int(problem_id))
            except ValueError:
                # Handle cases where problem_id is not a valid integer, though DRF might handle this earlier
                return Submission.objects.none() # Return an empty queryset
        
        return queryset.order_by('-submitted_at') # Order by most recent
    
    def get_serializer_class(self):
        """
        Use different serializers based on action
        """
        if self.action == 'create':
            return SubmissionCreateSerializer
        if self.action == 'retrieve':
            return SubmissionDetailSerializer
        return SubmissionResultSerializer
    
    def perform_create(self, serializer):
        """
        Set the user, submitted_at, process code execution, and determine rank.
        """
        problem_instance = serializer.validated_data['problem']
        language = serializer.validated_data['language']
        code_to_execute = serializer.validated_data['code']
        started_at = serializer.validated_data['started_at']
        submitted_at = timezone.now()
        
        # Prepare harness_eval_files for the execution service
        # The Problem.harness_eval_files is already a JSONB field storing a list of dicts
        # with 'filename' and 'content', which matches the expected ExecutionFile structure.
        harness_files = problem_instance.harness_eval_files or []

        # Call the code execution service (currently mock)
        # version is not explicitly stored in Submission model yet, passing None or a default.
        execution_result: ExecutionResult = execute_code(
            language=language,
            version=None, # Or a default like "latest" if appropriate
            code_to_execute=code_to_execute,
            harness_eval_files=harness_files
        )

        # Determine 'passed' status
        # For this mock, we'll consider 'success' status as passed.
        # A real implementation might check stdout for specific markers from eval scripts.
        passed_status = (execution_result['status'] == 'success')

        # Calculate duration
        final_duration_ms = int((submitted_at - started_at).total_seconds() * 1000)
        if not (final_duration_ms >= 0 and final_duration_ms <= 24 * 60 *60 * 1000):
            final_duration_ms = 24 * 60 *60 * 1000 # 24 hours

        # Determine rank based on duration and problem's time_thresholds
        calculated_rank = "VP of Engineering" # Default rank
        if passed_status and final_duration_ms is not None and problem_instance.time_thresholds:
            # Sort thresholds by max_minutes to ensure correct rank assignment
            # Assuming thresholds are like: [{ "max_minutes":3,"rank":"Wizard" }, ...]
            sorted_thresholds = sorted(problem_instance.time_thresholds, key=lambda t: t.get('max_minutes', float('inf')))
            duration_minutes = final_duration_ms / (1000 * 60)
            for threshold in sorted_thresholds:
                if duration_minutes <= threshold.get('max_minutes', float('inf')):
                    calculated_rank = threshold.get('rank', calculated_rank)
                    break
        
        # Create and save the submission instance
        submission = serializer.save(
            user=self.request.user,
            submitted_at=submitted_at,
            status=execution_result['status'],
            duration_ms=final_duration_ms,
            memory_kb=execution_result['memory_kb'],
            passed=passed_status,
            rank=calculated_rank,
            raw_results=execution_result # Store the entire result from the service
        )
        
        # Optionally, you might want to trigger other actions here,
        # like sending notifications or updating user stats (in a future step).

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Return statistics about the user's submissions
        """
        user_submissions = Submission.objects.filter(user=request.user)
        
        # Count submissions and successful submissions
        total_submissions = user_submissions.count()
        successful_submissions = user_submissions.filter(passed=True).count()
        
        # Get average duration for successful submissions
        avg_duration = user_submissions.filter(passed=True).aggregate(
            avg_duration=Avg('duration_ms')
        )
        
        # Get problems solved
        problems_solved = user_submissions.filter(passed=True).values('problem').distinct().count()
        
        return Response({
            'total_submissions': total_submissions,
            'successful_submissions': successful_submissions,
            'average_duration_ms': avg_duration.get('avg_duration'),
            'problems_solved': problems_solved
        })


class ScorecardView(APIView):
    # permission_classes = [IsAuthenticated]
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        target_username = request.query_params.get('username')
        
        user_to_display = None
        
        if target_username:
            # Optional: Add check if the requesting user has permission to view other's scorecard
            # For now, allow viewing any user if username is provided
            try:
                user_to_display = User.objects.get(username=target_username)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
        else:
            user_to_display = request.user

        # Fetch latest 1000 submissions for the user_to_display
        latest_1000_submissions = Submission.objects.filter(
                user=user_to_display,
                duration_ms__gte=5000
            ).order_by('-submitted_at')[:1000]

        print(latest_1000_submissions, flush=True)

        # Get all enabled problems for coverage calculation
        rank_to_score = {
            'Wizard': 6,
            'Senior Engineer': 5,
            'Mid-Level Engineer': 4,
            'New Grad': 3,
            'Participation Trophy': 2,
            'Newbie': 1
        }
        problems = Problem.objects.filter(enabled=True)
        problems_and_status = []
        for problem in problems:
            attempted = False
            passed = False
            rank_scores = []
            for s in latest_1000_submissions:
                if s.problem_id != problem.id: continue
                attempted = True
                rank_scores.append(0)
                if not s.passed: continue
                passed = True
                rank_scores.append(rank_to_score.get(s.rank, 0))
            problems_and_status.append({
                "id": problem.id,
                "title": problem.title,
                "slug": problem.slug,
                "attempted": attempted,
                "passed": passed,
                "status": "✅" if passed else "🔴" if attempted else "",
                'rank_score': max(rank_scores) if rank_scores else None
            })
        attempted_count = len([p for p in problems_and_status if p["attempted"]])
        passed_count = len([p for p in problems_and_status if p["status"] == "✅"])
        rank_scores = [p['rank_score'] for p in problems_and_status if p['rank_score'] is not None]
        avg_rank_score = sum(rank_scores) / len(rank_scores) if rank_scores else 0
        scorecard_problem_coverage = attempted_count / problems.count()

        scorecard_rank = "Newbie"
        if avg_rank_score >= 5.5 and scorecard_problem_coverage >= 0.8:
            scorecard_rank = "Wizard"
        elif avg_rank_score >= 4.5 and scorecard_problem_coverage >= 0.7:
            scorecard_rank = "Senior Engineer"
        elif avg_rank_score >= 3.5 and scorecard_problem_coverage >= 0.5:
            scorecard_rank = "Mid-Level Engineer"
        elif avg_rank_score >= 2.5 and scorecard_problem_coverage >= 0.3:
            scorecard_rank = "New Grad"
        elif avg_rank_score >= 1.5 and scorecard_problem_coverage >= 0.1:
            scorecard_rank = "Participation Trophy"
            

        # Dummy scorecard data
        scorecard_data = {
            "username": user_to_display.username,
            "avg_rank_score": avg_rank_score,
            "scorecard_rank": scorecard_rank,
            "scorecard_problem_coverage": scorecard_problem_coverage,
            "problems_and_status": problems_and_status,
            'passed_count': passed_count,
        }
        return Response(scorecard_data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both current and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Change password
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password changed successfully'}) 