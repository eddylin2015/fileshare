const coolauth_users=[
    {username : 't1',password : '123123'},
    {username : 'pi',password : 'Pi@@2018'}
]
function ReqAuth(u,p){
    for(let u_ of coolauth_users){
        if((u_.username == u) && (u_.password == p)) {   
            return u_.username ;
        }
    }
    return null;
}
exports.coolauth_users = coolauth_users;
exports.ReqAuth = ReqAuth;