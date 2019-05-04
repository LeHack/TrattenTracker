#!/bin/bash

if [[ ! -d .pyenv ]]; then
  curl https://pyenv.run | bash
fi

export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

pyenv install 3.7.2 -s
pyenv virtualenv 3.7.2 jenkins-tt || echo "Env already exists"
pyenv local jenkins-tt

pip install -U pip setuptools
pip install -e ".[dev]"

coverage run --source=ttapp --omit=\*/migrations/\* -m pytest --junit-xml=test-results/pytest.xml
coverage html --fail-under=80 -d coverage-report 
exit $?
