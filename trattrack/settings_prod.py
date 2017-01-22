from .settings import *

# Production only settings
DEBUG = False
STATICFILES_DIRS = (os.path.join(BASE_DIR, "build"),)
