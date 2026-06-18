from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class CookieAuthTests(APITestCase):
    def setUp(self):
        self.username = "testuser"
        self.email = "testuser@example.com"
        self.password = "Secr3tP@ssw0rd!"
        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        self.login_url = reverse("login")
        self.refresh_url = reverse("refresh")
        self.logout_url = reverse("logout")
        self.register_url = reverse("register")

    def test_user_registration(self):
        """Test standard registration succeeds."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "NewUserP@ss!",
            "first_name": "New",
            "last_name": "User"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_login_sets_cookie_and_returns_access_token(self):
        """Test that login returns access token and sets the refresh_token cookie."""
        data = {
            "username": self.username,
            "password": self.password,
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Access token must be in the JSON payload
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)

        # Refresh token must be in HttpOnly cookie
        self.assertIn("refresh_token", response.cookies)
        refresh_cookie = response.cookies["refresh_token"]
        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(refresh_cookie["samesite"], "Lax")

    def test_refresh_token_from_cookie(self):
        """Test that token refresh succeeds when sending the refresh token in a cookie."""
        # 1. Log in to get the cookie
        login_data = {
            "username": self.username,
            "password": self.password,
        }
        login_response = self.client.post(self.login_url, login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Verify cookie exists in the test client
        self.assertIn("refresh_token", self.client.cookies)

        # 2. Call refresh endpoint without passing refresh token in request body
        refresh_response = self.client.post(self.refresh_url, {})
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)

        # Verify a new access token is returned
        self.assertIn("access", refresh_response.data)

    def test_logout_deletes_cookie(self):
        """Test that logout deletes the refresh_token cookie."""
        # 1. Log in to get the cookie
        login_data = {
            "username": self.username,
            "password": self.password,
        }
        self.client.post(self.login_url, login_data)
        self.assertIn("refresh_token", self.client.cookies)

        # 2. Call logout
        logout_response = self.client.post(self.logout_url, {})
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Check if the cookie is set to be deleted (max_age=0 / empty value / expired)
        refresh_cookie = logout_response.cookies.get("refresh_token")
        if refresh_cookie:
            self.assertEqual(refresh_cookie.value, "")
            self.assertEqual(refresh_cookie["max-age"], 0)
