from django import forms

collapse_text_input = forms.TextInput(attrs={'class': 'col-sm-9 form-control form-control-sm'})
collapse_array_input = forms.NumberInput(attrs={'class': 'col-sm-9 form-control form-control-sm'})


class BaseForm(forms.Form):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')  # globally override the Django >=1.6 default of ':'
        super(BaseForm, self).__init__(*args, **kwargs)


class CatalogForm(BaseForm):
    name = forms.CharField(max_length=100, required=True, label='名称', widget=collapse_text_input)
    index = forms.CharField(max_length=100, required=True, label='索引', widget=collapse_text_input)


class PointsForm(BaseForm):
    point1 = forms.IntegerField(required=True, label='单选', widget=collapse_array_input, initial=1)
    point2 = forms.IntegerField(required=True, label='多选', widget=collapse_array_input, initial=1)
    point3 = forms.IntegerField(required=True, label='判断', widget=collapse_array_input, initial=1)
    point4 = forms.IntegerField(required=True, label='文填', widget=collapse_array_input, initial=1)
    point5 = forms.IntegerField(required=True, label='数填', widget=collapse_array_input, initial=1)
    point6 = forms.IntegerField(required=True, label='简答', widget=collapse_array_input, initial=1)
    point7 = forms.IntegerField(required=True, label='主观', widget=collapse_array_input, initial=1)
    point8 = forms.IntegerField(required=True, label='综合', widget=collapse_array_input, initial=1)


class DifficultyForm(BaseForm):
    diff1 = forms.IntegerField(required=True, label='单选', widget=collapse_array_input, initial=1)
    diff2 = forms.IntegerField(required=True, label='多选', widget=collapse_array_input, initial=1)
    diff3 = forms.IntegerField(required=True, label='判断', widget=collapse_array_input, initial=1)
    diff4 = forms.IntegerField(required=True, label='文填', widget=collapse_array_input, initial=1)
    diff5 = forms.IntegerField(required=True, label='数填', widget=collapse_array_input, initial=1)
    diff6 = forms.IntegerField(required=True, label='简答', widget=collapse_array_input, initial=1)
    diff7 = forms.IntegerField(required=True, label='主观', widget=collapse_array_input, initial=1)
    diff8 = forms.IntegerField(required=True, label='综合', widget=collapse_array_input, initial=1)
