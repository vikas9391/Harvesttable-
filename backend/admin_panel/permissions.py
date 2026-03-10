from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class IsAdminUser(BasePermission):
    """
    Allows access only to users whose profile has `is_staff=True`
    OR whose UserProfile has `is_admin=True` (whichever your project uses).

    The ProfilePage.tsx checks `profile.isAdmin` which is serialised from
    `UserProfile.is_admin`; we mirror that check here.
    """

    message = "You do not have permission to perform this action. Admin access required."

    def has_permission(self, request: Request, view: object) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False

        # 1. Django built-in staff flag (works out of the box)
        if request.user.is_staff:
            return True

        # 2. Custom UserProfile.is_admin flag (used by ProfilePage / ProfileSerializer)
        try:
            return bool(request.user.userprofile.is_admin)
        except AttributeError:
            pass

        # 3. Some projects store it directly on a custom User model
        return bool(getattr(request.user, "is_admin", False))