#!/usr/bin/env python
# -*- coding: utf-8 -*-


import os
import sys
import logging
import json
from datetime import timedelta
from flask import Flask, session, request, redirect, render_template
from flask_assets import Environment, Bundle
from lib import tweet

CONFIG_FILE = "etc/tweet.json"

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']

assets = Environment(app)
assets.url = app.static_url_path
scss = Bundle('scss/style.scss', filters='pyscss', output='css/style.css')
assets.register('style_scss', scss)

@app.before_request
def before_request():
    print "INFO: before_request"
    if request.path == '/login':
        return
    elif request.path == '/logout':
        return
    elif request.path[-4:] == ".css":
        return
    elif request.path[-3:] == ".js":
        return
    elif tweet.check_token():
        return
    else:
        session.permanent = True
        app.permanent_session_lifetime = timedelta(minutes=5)
        return redirect('/login')


@app.route('/login', methods=['GET'])
def login():
    print "INFO: login"
    t = tweet.Tweet(CONFIG_FILE)
    redirect_url = t.get_redirect_url()
    return redirect(redirect_url)


@app.route('/logout', methods=['GET'])
def logout():
    print "INFO: logout"
    tweet.clean_session()
    return redirect('/login')


@app.route('/', methods=['GET'])
def index():
    print "INFO: index"
    return render_template('index.html')


@app.route('/_get_tweets', methods=['POST'])
def _get_tweets():
    print "INFO: _get_tweets"
    print "request:", request.json
    t = tweet.Tweet(CONFIG_FILE)
    try:
        t.set_access_token()
        tweets = t.get_tweets(request.json['twtype'], request.json['params'])
    except tweet.RequestDenied as detail:
        print "ERROR:", detail
        #return render_template('error.html', message=detail)
        return redirect('/logout')

    with open("timeline.json", 'w') as f:
        json.dump(tweets, f)

    if isinstance(tweets, dict):
        if 'errors' in tweets.keys():
            print "ERROR: ", tweets
            return render_template('error.html', message=tweets['errors'][0]['message'])
        elif 'statuses' in tweets.keys():
            tweets = tweets['statuses']

    for t in tweets[:]:
        if 'media' not in t['entities'].keys():
            tweets.remove(t)

    print "tweets_num:", len(tweets)
    return render_template('tweets.html', tweets=tweets)


if __name__ == "__main__":
    app.debug = True
    app.logger.addHandler(logging.StreamHandler(sys.stdout))
    app.run(threaded=True)
