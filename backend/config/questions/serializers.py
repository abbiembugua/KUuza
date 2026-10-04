from rest_framework import serializers
from .models import ListingQuestion


class ListingQuestionSerializer(serializers.ModelSerializer):
    asker_name    = serializers.CharField(source='asker.full_name', read_only=True)
    asker_picture = serializers.SerializerMethodField()
    is_answered   = serializers.SerializerMethodField()

    class Meta:
        model  = ListingQuestion
        fields = [
            'id', 'listing',
            'asker', 'asker_name', 'asker_picture',
            'question', 'answer', 'answered_at', 'is_answered',
            'created_at',
        ]
        read_only_fields = [
            'asker', 'asker_name', 'asker_picture',
            'answer', 'answered_at', 'is_answered',
            'created_at',
        ]

    def get_asker_picture(self, obj):
        if not (obj.asker and obj.asker.profile_picture):
            return None
        request = self.context.get('request')
        url = obj.asker.profile_picture.url
        return request.build_absolute_uri(url) if request else url

    def get_is_answered(self, obj):
        return bool(obj.answer)
