const serverless = require("serverless-http");
const express = require("express");
const fs = require('fs');

const app = express();
// const httpX = require('http').Server(app);
const path = require('path');
let folders=['xxx','xxx','xxx','xxx','xxx','harmonics']
console.log('[][][01]', folders)
folders=fs.readdirSync(path.join(__dirname, '/depoly/'), {withFileTypes: true}).filter(item => item.isDirectory()).map(item => item.name)
console.log('[][][02]', folders)
webRoot_d=''
webRoot_p='/web'
// console.log('[][][0]', new Date().toISOString())
app.get('/web/:whichX', (req, res, next) => {
    urlArr=req.url.split('/')
    console.log('[][][1]', req.params.whichX,urlArr,req.url.split('/').length)
    folders.map((item)=>{
        if(item===req.params.whichX){
            webRoot_d = path.join(__dirname, '/depoly/'+req.params.whichX)
            app.use('/web/'+item, express.static(webRoot_d));

        }
    });
    // if(urlArr.length>=2&&urlArr[1]==='web'){
    //   webRoot_p = '/web/'+req.params.whichX
    //   webRoot_d = path.join(__dirname, '/depoly/'+req.params.whichX)
    //   console.log('[][2][]webRoot_d:',urlArr, webRoot_p,webRoot_d)
    //   app.use('/web', express.static(webRoot_d));
    // }
    app.use('/web', express.static(webRoot_d));
    next()
})


if (process.env.ENVIRONMENT !== 'local') {
    exports.handler = serverless(app);
} else {
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);
    });
}





