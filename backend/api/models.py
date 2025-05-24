from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField


class Problem(models.Model):
    title = models.TextField(null=False)
    slug = models.TextField(null=False, unique=True)
    description_md = models.TextField(null=False)
    tags = ArrayField(models.TextField(), default=list)
    difficulty = models.TextField(null=True, blank=True)
    time_thresholds = models.JSONField(null=False)
    solution_templates = models.JSONField(null=False)
    reference_solutions = models.JSONField(null=False)
    harness_eval_files = models.JSONField(null=True, blank=True)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'problems'

    def __str__(self):
        return self.title


class Submission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    language = models.TextField(null=False)
    code = models.TextField(null=False)
    started_at = models.DateTimeField(null=False)
    submitted_at = models.DateTimeField(null=False)
    status = models.TextField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    memory_kb = models.IntegerField(null=True, blank=True)
    passed = models.BooleanField(null=False)
    rank = models.TextField(null=True, blank=True)
    raw_results = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'submissions'

    def __str__(self):
        return f"{self.user.username if self.user else 'Anonymous'} - {self.problem.title} - {self.language}" 