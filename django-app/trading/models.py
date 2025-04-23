from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    virtual_funds = models.DecimalField(max_digits=18, decimal_places=2, default=10000)
    level = models.IntegerField(default=1)
    streak_count = models.IntegerField(default=0)
    profile_icon = models.CharField(max_length=255, blank=True, null=True)
    total_trades = models.IntegerField(default=0)
    net_profit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    last_login_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.username

class Quest(models.Model):
    QUEST_TYPES = [
        ('daily', 'Daily'),
        ('investment', 'Investment'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField()
    quest_type = models.CharField(max_length=20, choices=QUEST_TYPES)
    goal_description = models.TextField()
    reward_points = models.IntegerField()
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class UserQuest(models.Model):
    QUEST_STATUS = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=QUEST_STATUS)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)

class Trade(models.Model):
    TRADE_TYPES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    crypto_symbol = models.CharField(max_length=10)
    trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
    quantity = models.DecimalField(max_digits=18, decimal_places=8)
    price_per_unit = models.DecimalField(max_digits=18, decimal_places=8)
    total_value = models.DecimalField(max_digits=18, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    quest = models.ForeignKey(Quest, on_delete=models.SET_NULL, null=True, blank=True)

class PortfolioHolding(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    crypto_symbol = models.CharField(max_length=10)
    quantity = models.DecimalField(max_digits=18, decimal_places=8)
    average_buy_price = models.DecimalField(max_digits=18, decimal_places=8)

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    criteria_description = models.TextField()
    badge_icon = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    achieved_at = models.DateTimeField(auto_now_add=True)

class Leaderboard(models.Model):
    LEADERBOARD_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('tournament', 'Tournament'),
    ]
    type = models.CharField(max_length=20, choices=LEADERBOARD_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()

class LeaderboardEntry(models.Model):
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    profit = models.DecimalField(max_digits=18, decimal_places=2)
    rank = models.IntegerField()

# could implement score_types instead of profit model, with the 
# default being profit, and in db can have attributes like
# xp, no. of trades, login streak, 
# that can be displayed by pressing the top of the section, (for eg 
# if i pressed on the xp section, it will sort users with highest xp to
# lowest)

# implementation:
# SCORE_TYPES = [
#   ('profit', 'Profit'),
#   ('xp', 'XP'),
#   ('trades', 'Number of Trades'),
#   ('streak', 'Login Streak'),
# ]
# score = models.DecimalField(max_digits=18, decimal_places=2)
# score_type = models.CharField(max_length=50, choices=SCORE_TYPES, default='profit')
