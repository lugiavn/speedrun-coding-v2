from django.test import TestCase
from django.contrib.auth.models import User
from .models import Problem, Submission


class ProblemModelTests(TestCase):
    def test_problem_creation(self):
        problem = Problem.objects.create(
            title="Test Problem",
            slug="test-problem",
            description_md="This is a test problem",
            time_thresholds=[{"max_minutes": 5, "rank": "Senior Engineer"}],
            solution_templates={"python": "def solution():\n    pass"},
            reference_solutions={"python": "def solution():\n    return True"}
        )
        self.assertEqual(problem.title, "Test Problem")
        self.assertEqual(problem.slug, "test-problem") 