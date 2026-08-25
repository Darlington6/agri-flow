from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import UserSerializer, UserUpdateSerializer


class MeView(APIView):
    """GET is the concrete proof the whole auth chain works — the same
    role a health-check endpoint plays for infra. PATCH is self-service
    profile editing, deliberately narrow (see UserUpdateSerializer).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
