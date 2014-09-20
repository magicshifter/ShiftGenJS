import sys
import os
from optparse import OptionParser
from pprint import pprint

import logging
import os.path
import uuid
import json
import threading
import hashlib

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
from tornado.options import define, options

import serial
import serial.tools.list_ports


favicon_path = '/path/to/favicon.ico'

settings = {'debug': True}

handlers = [(r'/(.*)', tornado.web.StaticFileHandler, {'path': "."})]


application = tornado.web.Application(handlers, **settings)
application.listen(1337)
tornado.ioloop.IOLoop.instance().start()