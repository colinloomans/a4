#Version 1.0
#This program was created by Trever Gannon on 9/13/2017
#The only two suggested things to change are FilePath (line 10), or PORT(line 11).
import os
import http.server
import socketserver
import sys
import time

FilePath = "C:\\Users\\Trever\\source\\repos\\Graphics"
PORT = 8000

if not(os.path.exists(FilePath)):
    print("The file path you provided does not exist, or this program does not have access to it! Please edit the script and change the FilePath Variable")
    time.sleep(5)
    sys.exit(1)

os.chdir(FilePath) #changes the filepath to one specified.

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.serve_forever()

print("Success! Put \"localhost:" + str(PORT) + "\" in your web browser to access your server.")