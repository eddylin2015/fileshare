from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
import os
import socket
#filesystems.py & handlers.py  'utf8'->'big5hkscs'
localcode="big5hkscs"
username="user"
password="123"
port=21
ftpdoc=os.getcwd()+"/www/ftp-doc";
ftpano=os.getcwd()+"/www/ftp-doc/anonymous";
#os.system('chcp 936')  ## 指定本次CMD窗口编码：gbk
hostname = socket.gethostbyname(socket.gethostname()) # 获取某一网络分配到本机的IP地址
authorizer = DummyAuthorizer()
users=["elena","jimmy","eddy","sio"]
for u_ in users:
    authorizer.add_user(u_, "123", ftpdoc+"/"+u_ , perm="elradfmwMT")
authorizer.add_anonymous(ftpano)
handler = FTPHandler
handler.encoding = localcode # 指定服务器编码为gbk big5hkscs
handler.use_encoding = 1
handler.authorizer = authorizer
handler.banner = "pyftpdlib based ftpd ready."
#handler.passive_ports = range(60000, 65535)
server = FTPServer(("0.0.0.0", 21), handler)
server.max_cons = 256
server.max_cons_per_ip = 5
print(f'\n>>> FTP服务器根目录为当前目录\n\n')
print(f'\n>>> 局域网内本机地址：{hostname}，端口：{2121}')
print(f'\n>>> 用户名：{username}, 密码：{password}')
print(f'\n>>> 可在浏览器输入【ftp://{hostname}:{port}】进行登录\n\n')
server.serve_forever()

# End.


"""A basic FTP server which uses a DummyAuthorizer for managing 'virtual
users', setting a limit for incoming connections and a range of passive
ports.

"""

def main():

    '''
    add_user(username, password, homedir, perm="elr", msg_login="Login successful.", msg_quit="Goodbye.")
    Add a user to the virtual users table. AuthorizerError exception is raised on error conditions such as insufficient permissions or duplicate usernames. Optional perm argument is a set of letters referencing the user’s permissions. Every letter is used to indicate that the access rights the current FTP user has over the following specific actions are granted. The available permissions are the following listed below:

    Read permissions:

    "e" = change directory (CWD, CDUP commands)
    "l" = list files (LIST, NLST, STAT, MLSD, MLST, SIZE commands)
    "r" = retrieve file from the server (RETR command)
    Write permissions:

    "a" = append data to an existing file (APPE command)
    "d" = delete file or directory (DELE, RMD commands)
    "f" = rename file or directory (RNFR, RNTO commands)
    "m" = create directory (MKD command)
    "w" = store a file to the server (STOR, STOU commands)
    "M" = change file mode / permission (SITE CHMOD command) New in 0.7.0
    "T" = change file modification time (SITE MFMT command) New in 1.5.3
    Optional msg_login and msg_quit arguments can be specified to provide customized response strings when user log-in and quit. The perm argument of the add_user() method refers to user’s permissions. Every letter is used to indicate that the access rights the current FTP user has over the following specific actions are granted.


    add_anonymous(homedir, **kwargs)
    Add an anonymous user to the virtual users table. AuthorizerError exception is raised on error conditions such as insufficient permissions, missing home directory, or duplicate anonymous users. The keyword arguments in kwargs are the same expected by add_user() method: perm, msg_login and msg_quit. The optional perm keyword argument is a string defaulting to “elr” referencing “read-only” anonymous user’s permission. Using a “write” value results in a RuntimeWarning.
    '''


    # Instantiate a dummy authorizer for managing 'virtual' users
    authorizer = DummyAuthorizer()

    # Define a new user having full r/w permissions and a read-only
    authorizer.add_user(
        username=username, 
        password=password, 
        homedir=os.getcwd(), # 指定当前目录为FTP服务器的根目录
        perm='elradfmwMT', # 操作权限
        msg_login="Login successful.",
        msg_quit="Goodbye."
        )

    # anonymous user
    #authorizer.add_anonymous(os.getcwd())

    # Instantiate FTP handler class
    handler = FTPHandler
    handler.encoding = 'gbk' # 指定服务器编码为gbk
    handler.use_encoding = 1
    handler.authorizer = authorizer

    # Define a customized banner (string returned when client connects)
    handler.banner = "pyftpdlib based ftpd ready."

    # Specify a masquerade address and the range of ports to use for
    # passive connections.  Decomment in case you're behind a NAT.
    # handler.masquerade_address = '151.25.42.11'
    handler.passive_ports = range(60000, 65535)

    # Instantiate FTP server class and listen on 0.0.0.0:2121
    address = (hostname, port)  #ftp://192.168.108.207:2121  #localhost
    server = FTPServer(address, handler)

    # set a limit for connections
    server.max_cons = 256
    server.max_cons_per_ip = 5

    print(f'\n>>> FTP服务器根目录为当前目录\n\n')
    print(f'\n>>> 局域网内本机地址：{hostname}，端口：{2121}')
    print(f'\n>>> 用户名：{username}, 密码：{password}')
    print(f'\n>>> 可在浏览器输入【ftp://{hostname}:{port}】进行登录\n\n')
    # start ftp server
    server.serve_forever()



#if __name__ == '__main__':
#    try:
#        main()
#    except Exception:
#        traceback.print_exc()
#        with open('error.txt', 'w', encoding='utf-8') as f:
#            traceback.print_exc(file=f)
#        input('\n程序运行异常...')