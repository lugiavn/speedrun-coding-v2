from django.contrib import admin
from django.utils.html import format_html
from django.forms import JSONField, Textarea
from .models import Problem, Submission


class JSONFieldWidget(Textarea):
    """
    Custom widget for JSON fields to display them in a more readable format.
    """
    def __init__(self, attrs=None):
        default_attrs = {'cols': '80', 'rows': '10'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'difficulty', 'enabled', 'tag_list', 'created_at')
    search_fields = ('title', 'slug', 'description_md')
    list_filter = ('difficulty', 'tags')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description_md', 'tags', 'difficulty', 'enabled')
        }),
        ('Time Thresholds', {
            'fields': ('time_thresholds',),
            'description': 'JSON array of objects with max_minutes and rank fields.'
        }),
        ('Code Templates', {
            'fields': ('solution_templates',),
            'description': 'JSON object mapping language to template code.'
        }),
        ('Reference Solutions', {
            'fields': ('reference_solutions',),
            'description': 'JSON object mapping language to solution code. Only visible to admins.'
        }),
        ('Evaluation Files', {
            'fields': ('harness_eval_files',),
            'description': 'JSON array of objects with filename, lang, and content fields. Contains sensitive information.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )
    
    formfield_overrides = {
        # Use custom widget for all JSONField
        Problem.time_thresholds.field.__class__: {'widget': JSONFieldWidget},
        Problem.solution_templates.field.__class__: {'widget': JSONFieldWidget},
        Problem.reference_solutions.field.__class__: {'widget': JSONFieldWidget},
        Problem.harness_eval_files.field.__class__: {'widget': JSONFieldWidget},
    }
    
    def tag_list(self, obj):
        """Display tags as a comma-separated list"""
        return ", ".join(obj.tags) if obj.tags else ""
    tag_list.short_description = "Tags"


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'problem', 'language', 'passed', 'rank', 'duration_display', 'submitted_at')
    list_filter = ('passed', 'language', 'rank')
    search_fields = ('user__username', 'problem__title', 'code')
    readonly_fields = ('created_at', 'raw_results_display')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'problem', 'language', 'passed', 'rank')
        }),
        ('Timing', {
            'fields': ('started_at', 'submitted_at', 'duration_ms')
        }),
        ('Code', {
            'fields': ('code',),
            'classes': ('collapse',),
        }),
        ('Results', {
            'fields': ('status', 'memory_kb', 'raw_results_display'),
        }),
        ('Timestamps', {
            'fields': ('created_at',),
        }),
    )
    
    def duration_display(self, obj):
        """Format duration in a readable way"""
        if obj.duration_ms:
            seconds = obj.duration_ms / 1000
            if seconds < 60:
                return f"{seconds:.2f} seconds"
            minutes = seconds / 60
            return f"{minutes:.2f} minutes"
        return "N/A"
    duration_display.short_description = "Duration"
    
    def raw_results_display(self, obj):
        """Format raw_results as pretty JSON"""
        if obj.raw_results:
            import json
            return format_html('<pre>{}</pre>', json.dumps(obj.raw_results, indent=2))
        return "N/A"
    raw_results_display.short_description = "Raw Results" 