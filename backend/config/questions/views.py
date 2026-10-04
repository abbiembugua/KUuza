from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from listings.models import Listing
from .models import ListingQuestion
from .serializers import ListingQuestionSerializer
from .moderation import check_content

UNANSWERED_CAP = 2


class QuestionListCreateView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        listing_id = request.query_params.get('listing')
        if not listing_id:
            return Response({'error': 'listing query param required.'}, status=status.HTTP_400_BAD_REQUEST)
        questions = ListingQuestion.objects.filter(
            listing_id=listing_id
        ).select_related('asker', 'listing__seller')
        serializer = ListingQuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        listing_id    = request.data.get('listing')
        question_text = (request.data.get('question') or '').strip()

        if not listing_id:
            return Response({'error': 'listing is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not question_text:
            return Response({'error': 'Question cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            listing = Listing.objects.select_related('seller').get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        if listing.seller == request.user:
            return Response({'error': 'You cannot ask a question on your own listing.'}, status=status.HTTP_400_BAD_REQUEST)

        # Cap: max UNANSWERED_CAP open questions per user per listing
        unanswered = ListingQuestion.objects.filter(
            listing=listing,
            asker=request.user,
            answer='',
        ).count()
        if unanswered >= UNANSWERED_CAP:
            return Response(
                {'error': f'You already have {UNANSWERED_CAP} unanswered questions on this listing. Wait for the seller to reply before asking more.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        moderation_error = check_content(question_text)
        if moderation_error:
            return Response({'error': moderation_error}, status=status.HTTP_400_BAD_REQUEST)

        question = ListingQuestion.objects.create(
            listing=listing,
            asker=request.user,
            question=question_text,
        )

        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=listing.seller,
                actor=request.user,
                listing=listing,
                notification_type='question_asked',
                title='New question on your listing',
                body=f'{request.user.full_name} asked: "{question_text[:100]}" on "{listing.title}".',
            )
        except Exception:
            pass

        serializer = ListingQuestionSerializer(question, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class QuestionDetailView(APIView):
    """Edit or delete a question (asker only, unanswered only)."""
    permission_classes = [IsAuthenticated]

    def _get_question(self, pk):
        try:
            return ListingQuestion.objects.select_related('listing__seller', 'asker').get(pk=pk)
        except ListingQuestion.DoesNotExist:
            return None

    def patch(self, request, pk):
        question = self._get_question(pk)
        if not question:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        if question.asker != request.user:
            return Response({'error': 'You can only edit your own questions.'}, status=status.HTTP_403_FORBIDDEN)
        if question.answer:
            return Response({'error': 'This question has already been answered and cannot be edited.'}, status=status.HTTP_400_BAD_REQUEST)

        new_text = (request.data.get('question') or '').strip()
        if not new_text:
            return Response({'error': 'Question cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        moderation_error = check_content(new_text)
        if moderation_error:
            return Response({'error': moderation_error}, status=status.HTTP_400_BAD_REQUEST)

        question.question = new_text
        question.save(update_fields=['question'])
        return Response(ListingQuestionSerializer(question, context={'request': request}).data)

    def delete(self, request, pk):
        question = self._get_question(pk)
        if not question:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        if question.asker != request.user:
            return Response({'error': 'You can only delete your own questions.'}, status=status.HTTP_403_FORBIDDEN)
        if question.answer:
            return Response({'error': 'This question has already been answered and cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuestionAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_question(self, pk):
        try:
            return ListingQuestion.objects.select_related('listing__seller', 'asker').get(pk=pk)
        except ListingQuestion.DoesNotExist:
            return None

    def post(self, request, pk):
        """Add initial answer."""
        answer_text = (request.data.get('answer') or '').strip()
        if not answer_text:
            return Response({'error': 'Answer cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        question = self._get_question(pk)
        if not question:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        if question.listing.seller != request.user:
            return Response({'error': 'Only the listing seller can answer.'}, status=status.HTTP_403_FORBIDDEN)
        if question.answer:
            return Response({'error': 'This question has already been answered.'}, status=status.HTTP_400_BAD_REQUEST)

        moderation_error = check_content(answer_text)
        if moderation_error:
            return Response({'error': moderation_error}, status=status.HTTP_400_BAD_REQUEST)

        question.answer      = answer_text
        question.answered_at = timezone.now()
        question.save(update_fields=['answer', 'answered_at'])

        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=question.asker,
                actor=request.user,
                listing=question.listing,
                notification_type='question_answered',
                title='Your question was answered',
                body=f'{request.user.full_name} answered your question on "{question.listing.title}": "{answer_text[:100]}".',
            )
        except Exception:
            pass

        return Response(ListingQuestionSerializer(question, context={'request': request}).data)

    def patch(self, request, pk):
        """Edit an existing answer."""
        answer_text = (request.data.get('answer') or '').strip()
        if not answer_text:
            return Response({'error': 'Answer cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        question = self._get_question(pk)
        if not question:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        if question.listing.seller != request.user:
            return Response({'error': 'Only the listing seller can edit the answer.'}, status=status.HTTP_403_FORBIDDEN)
        if not question.answer:
            return Response({'error': 'No answer to edit.'}, status=status.HTTP_400_BAD_REQUEST)

        moderation_error = check_content(answer_text)
        if moderation_error:
            return Response({'error': moderation_error}, status=status.HTTP_400_BAD_REQUEST)

        question.answer = answer_text
        question.save(update_fields=['answer'])
        return Response(ListingQuestionSerializer(question, context={'request': request}).data)

    def delete(self, request, pk):
        """Remove an answer (question stays, becomes unanswered again)."""
        question = self._get_question(pk)
        if not question:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        if question.listing.seller != request.user:
            return Response({'error': 'Only the listing seller can delete the answer.'}, status=status.HTTP_403_FORBIDDEN)
        if not question.answer:
            return Response({'error': 'No answer to delete.'}, status=status.HTTP_400_BAD_REQUEST)

        question.answer      = ''
        question.answered_at = None
        question.save(update_fields=['answer', 'answered_at'])
        return Response(ListingQuestionSerializer(question, context={'request': request}).data)
