import os

from setuptools import setup

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'requirements.txt')) as f:
    requires = f.read()

with open(os.path.join(here, 'requirements_dev.txt')) as f:
    dev_requires = f.read()

setup(
    version='1.1.0',
    name='TrattenTracker',
    description='Track training attendance and payments',
    install_requires=requires,
    extras_require={
        'dev': dev_requires,
    },
)
