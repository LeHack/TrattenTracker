#!/bin/bash

coverage run --source=ttapp --omit=\*/migrations/\* -m pytest --junit-xml=test-results/pytest.xml
if [[ x"$1" == "xhtml" ]]; then
	coverage html -d coverage-report
	echo "See report at file://`pwd`/coverage-report/index.html"
else
	coverage report
fi 
