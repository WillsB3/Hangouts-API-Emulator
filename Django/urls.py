from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls.defaults import patterns, include, url
from django.views.generic import TemplateView

from django.conf import settings


urlpatterns = patterns('',
	(r'^hangouts$', TemplateView.as_view(template_name="hangouts-wrapper.html")),
	(r'^$', TemplateView.as_view(template_name="app.html"))
)

if not settings.DEBUG:

	urlpatterns = patterns('',
		(r'^hangouts$', TemplateView.as_view(template_name="hangouts-wrapper.html")),
		(r'^$', TemplateView.as_view(template_name="app.xml"))
	)


urlpatterns += staticfiles_urlpatterns()
