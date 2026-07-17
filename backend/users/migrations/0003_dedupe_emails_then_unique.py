# Replacement for PR #3's `0003_alter_user_email.py`.
#
# WHY: that migration only does AlterField(email, unique=True). On any DB that
# already has duplicate emails it fails with IntegrityError. This version dedupes
# first (RunPython) in the SAME migration, then applies the unique constraint, so
# it is safe in every environment.
#
# INTEGRATION: when PR #3 is merged, DELETE Prakhar's 0003_alter_user_email.py and
# keep this file instead (it covers both steps and has the same dependency).
from django.db import migrations, models
from django.db.models import Count


def dedupe_emails(apps, schema_editor):
    """Keep the earliest-joined account per email; remove the later duplicates."""
    User = apps.get_model("users", "User")
    dupes = User.objects.values("email").annotate(n=Count("id")).filter(n__gt=1)
    for row in dupes:
        email = row["email"]
        if not email:
            continue  # leave blank/null emails alone
        keep = User.objects.filter(email=email).order_by("date_joined").first()
        User.objects.filter(email=email).exclude(pk=keep.pk).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_user_profile_template_user_tagline_and_more"),
    ]

    operations = [
        migrations.RunPython(dedupe_emails, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]
