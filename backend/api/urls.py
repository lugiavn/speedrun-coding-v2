from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.decorators.csrf import csrf_exempt

from .views import UserViewSet, ProblemViewSet, SubmissionViewSet, RegisterView, ScorecardView, ChangePasswordView

# Create a router and register our viewsets
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'problems', ProblemViewSet)
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = [
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration endpoint
    path('register/', RegisterView.as_view(), name='register'),
    
    # Scorecard endpoint
    path('scorecard/', ScorecardView.as_view(), name='scorecard'),
    
    # Change password endpoint
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # API endpoints - registered with router
    path('', include(router.urls)),
] 