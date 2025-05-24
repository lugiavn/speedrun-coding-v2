from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Problem, Submission


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id', 'is_staff']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords must match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ProblemListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing problems - excludes sensitive information
    """
    class Meta:
        model = Problem
        fields = ['id', 'title', 'slug', 'description_md', 'tags', 'difficulty', 'time_thresholds']


class ProblemDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving a single problem - includes solution templates
    and reference solutions but excludes harness_eval_files
    """
    class Meta:
        model = Problem
        fields = ['id', 'title', 'slug', 'description_md', 'tags', 
                  'difficulty', 'time_thresholds', 'solution_templates',
                  'reference_solutions']


class ProblemAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for admin users - includes all fields including sensitive data
    """
    tags = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    
    class Meta:
        model = Problem
        fields = '__all__'
        
    def to_internal_value(self, data):
        # Ensure tags is always a list, even if it comes as null or empty string
        if 'tags' not in data or data['tags'] is None or data['tags'] == '':
            data = data.copy() if isinstance(data, dict) else {}
            data['tags'] = []
        return super().to_internal_value(data)


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new submission
    """
    class Meta:
        model = Submission
        fields = ['problem', 'language', 'code', 'started_at']
        

class SubmissionResultSerializer(serializers.ModelSerializer):
    """
    Serializer for returning submission results
    """
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'problem', 'problem_title', 'language', 'started_at', 
                  'submitted_at', 'status', 'duration_ms', 'memory_kb', 
                  'passed', 'rank']
        read_only_fields = ['id', 'submitted_at', 'status', 'duration_ms', 
                            'memory_kb', 'passed', 'rank', 'problem_title']


class SubmissionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed submission view - includes code
    """
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'problem', 'problem_title', 'user', 'username', 'language', 
                  'code', 'started_at', 'submitted_at', 'status', 'duration_ms', 
                  'memory_kb', 'passed', 'rank', 'raw_results']
        read_only_fields = ['id', 'submitted_at', 'status', 'duration_ms', 
                            'memory_kb', 'passed', 'rank', 'problem_title', 
                            'username', 'raw_results'] 