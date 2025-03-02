from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class CustomUser(AbstractUser):
    # not final
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)