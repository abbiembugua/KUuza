from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name            = serializers.CharField(source='reviewer.full_name', read_only=True)
    reviewee_name            = serializers.CharField(source='reviewee.full_name', read_only=True)
    reviewer_profile_picture = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id',
            'transaction_id',
            'reviewer', 'reviewer_name', 'reviewer_profile_picture',
            'reviewee', 'reviewee_name',
            'listing_title',
            'score',
            'comment',
            'created_at',
        ]
        read_only_fields = [
            'reviewer', 'reviewer_name', 'reviewer_profile_picture',
            'reviewee_name', 'created_at',
        ]

    def get_reviewer_profile_picture(self, obj):
        if not (obj.reviewer and obj.reviewer.profile_picture):
            return None
        request = self.context.get('request')
        url = obj.reviewer.profile_picture.url
        return request.build_absolute_uri(url) if request else url

    def validate_score(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Score must be between 1 and 5.')
        return value

    def validate(self, data):
        request      = self.context['request']
        transaction_id = data.get('transaction_id')
        reviewee     = data.get('reviewee')

        # Prevent self-review
        if reviewee == request.user:
            raise serializers.ValidationError('You cannot review yourself.')

        # Prevent duplicate review for same transaction
        if transaction_id:
            exists = Review.objects.filter(
                reviewer=request.user,
                transaction_id=transaction_id
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    'You have already submitted a review for this transaction.'
                )

        return data

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class ReviewSummarySerializer(serializers.Serializer):
    """
    Aggregated rating summary for a user — used on profile and listing pages.
    """
    average_rating = serializers.FloatField()
    total_reviews  = serializers.IntegerField()
    score_breakdown = serializers.DictField(child=serializers.IntegerField())