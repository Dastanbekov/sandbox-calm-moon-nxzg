from rest_framework.permissions import BasePermission

class IsActiveAndVerified(BasePermission):
    """
    Allows access only to authenticated users who have an active account (is_active=True).
    This enforces email verification before they can use protected endpoints.
    """
    message = "Для выполнения этого действия необходимо подтвердить email адрес."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active
        )
