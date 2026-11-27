from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PersonalDetailsSerializer
from .services import details_for

EMPTY = {
    "legal_name": "",
    "date_of_birth": None,
    "gender": "",
    "is_minor": False,
    "guardian_name": "",
    "guardian_relationship": "",
    "guardian_phone": "",
}


class PersonalDetailsView(APIView):
    """The signed-in person's own private details. GET answers with empty
    values before they're given; PUT saves them all at once."""

    def get(self, request):
        details = details_for(request.user)
        return Response(PersonalDetailsSerializer(details).data if details else EMPTY)

    def put(self, request):
        details = details_for(request.user)
        serializer = PersonalDetailsSerializer(details, data=request.data)
        serializer.is_valid(raise_exception=True)
        if details:
            serializer.save()
        else:
            serializer.save(user=request.user)
        return Response(serializer.data)
