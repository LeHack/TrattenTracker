try:
    from .settings import *
except ImportError:
    pass

# Production only settings
DEBUG = False
STATICFILES_DIRS = (os.path.join(BASE_DIR, "build"),)
