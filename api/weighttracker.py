#!/bin/python3
import json, flask
from flask import request, jsonify

app = flask.Flask(__name__)
app.config["DEBUG"] = True

@app.route('/api/schedule/', methods=['GET'])
def api_weighttracker():
    