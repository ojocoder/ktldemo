const path =  require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const fileUpload =  require('express-fileupload')
const mysql = require('mysql');
const util = require('util');
const uuid = require('uuid')
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcryt = require('bcryptjs');
const { check, validationResult }  = require('express-validator');
// const { json } = require('body-parser');
// const { error } = require('console');
// const { Redirect } = require('react-router-dom');
// const { url } = require('inspector');
const { response } = require('express');


let app = express();
let server = http.createServer(app);

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload())

let dbConnect = mysql.createConnection({
    host: '81.19.215.3',
    user: 'qvlzjgwt_ktlsample',
    password: 'ojox656@ktl',
    database: 'qvlzjgwt_ktl'
}) ;
// let dbConnect = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'ktl'
// }) ;


app.get('/check-db', (req, res)=>{
    dbConnect.connect((err)=>{
        if(err) return res.json({message:'error occured db  '})
        return res.json({message:'hello db  '})
    })
    res.json({message:'hello slash '})
})
// Authenticate middleware -----------------------------------------------------------------------------------------------
// ------------------------------------------ authenticate a token -------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------

const adminAuthMiddleWare = (req, res, next) =>{
    if (req.header('x-auth-token')) {
        let token = req.header('x-auth-token');
        try {
            jwt.verify(token, 'admin-secret', (err,adminData)=>{
                if(err) return  res.json({error: `Bad authentication`})
                dbConnect.query(`SELECT * FROM ktl_admin WHERE admin_name='${adminData.admin_name}'`, (error, result, fields)=>{
                    if (error) return  res.json({error: 'This admin is not found '})
                    const [RowDataPacket] = result 
                    req.admin = RowDataPacket
                    next()
                })

            })
        } catch (error) {
            res.status(401).json({error: error +' failed verification'})
        }
    }else{
        res.json({error: 'Admin not authenticated please login'})
    }
}


// Authenticate middleware -----------------------------------------------------------------------------------------------
// ------------------------------------------ authenticate a token -------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------

const userAuthMiddleWare = (req, res, next) =>{
    if (req.header('x-auth-token')) {
        let token = req.header('x-auth-token');
        try {
            jwt.verify(token, 'user-secret', (err,userData)=>{
                if(err) return  res.json({error: `Bad authentication`})
                // res.json({userData})
                dbConnect.query(`SELECT * FROM ktl_users WHERE user_name='${userData.user_name}'`, (error, result, fields)=>{
                    if (error) return  res.json({error: 'This user is not found '})
                    const [RowDataPacket] = result 
                    req.user = RowDataPacket
                    next()
                })

            })
        } catch (error) {
            res.status(401).json({error: error +' failed verification'})
        }
    }else{
        res.json({error: 'user not authenticated please login'})
    }
}

// Upload A new JOb 
app.use(express.static(path.join(__dirname, 'ktl-assets/jobs-extra')))
app.use(express.static(path.join(__dirname, 'ktl-assets')))
app.post('/job-upload', userAuthMiddleWare,async(req, res)=>{
    // console.log(req.files.file, 'the file object ')s
    try {
        const file = req.files.file;
        const fileName = file.name;
        const fileType = path.extname(fileName);
        const fileTypeRegex = /zip/;
        if (!fileTypeRegex.test(fileType)) {
           return res.json({response:{state:false, message:'pleas only zip files are accepted'}}); 
        }
        const md5 = req.user.user_name+'-'+Date.now()+'-job-file-'+file.md5;
        const URL = '/jobs/'+md5 + fileType
        // req.body.username+'-'+Date.now()+'-profile-image-'+file.md5;
        await util.promisify(file.mv)("./ktl-assets"+URL);
        dbConnect.query(`UPDATE ktl_jobs SET file='${URL}' WHERE reference='${req.body.reference}' AND user_id=${req.user.user_id}`, (error, result, fields)=>{
            if(error) return res.json({response: {state: false, message: error+ '  file not uploaded ', post: req.body, id:req.user.user_id}})
            res.json({response:{state: true, message: "File uploaded successfully"}})
        })
    } catch (error) {
        console.log(error, "the file upoad earror");
        res.status(500).json({rewponse:{state: false, message: "Error occured while trying to upload your job "}});
    }

});





// admin: add frame design 
app.post('/admin/add-frame', adminAuthMiddleWare,async(req, res)=>{
    try {
        const file = req.files.file;
        const fileName = file.name;
        const fileType = path.extname(fileName);

        const md5 = file.md5;
        const URL = '/jobs-extra/frames/'+md5 + fileType
        await util.promisify(file.mv)("./ktl-assets"+URL);
        let values = [
            req.body.price,
            'frames/'+md5 + fileType,
            req.body.status
        ]

        dbConnect.query(`INSERT INTO ktl_frames(price,image_url,status) VALUES(?)`,[values], function (err, result, fields) {
            if (err) throw err;
            res.json({response: {
                state: true,
                message: "new frame design  added"
            }})
        });
    } catch (error) {

        res.json({response: {
            state: false,
            message: "frame design not added"
        }})
    }

});

// Admin: add new photobook cover design 
app.post('/admin/add-photobook-cover', adminAuthMiddleWare,async(req, res)=>{
    console.log(req.files.file, 'the file object ')
    try {
        const file = req.files.file;
        const fileName = file.name;
        const fileType = path.extname(fileName);

        const md5 = file.md5;
        const URL = '/jobs-extra/covers/'+md5 + fileType
        await util.promisify(file.mv)("./ktl-assets"+URL);
        let values = [
            req.body.price,
            'covers/'+md5 + fileType,
            req.body.status
        ]

        dbConnect.query(`INSERT INTO ktl_photobook_covers(price,cover_url,status) VALUES(?)`,[values], function (err, result, fields) {
            if (err) throw err;
            res.json({response: {
                state: true,
                message: "new photobook design  added"
            }})
        });
    } catch (error) {
        console.log(error, "file upoad earror");

        res.json({response: {
            state: false,
            message: "photobook design not added"
        }})
    }

});



app.get("/uploader", (req, res)=>{
    res.json("react js can see this shit ");
})

// ktl users 

app.get('/admin/ktl-users', adminAuthMiddleWare,(req, res)=>{
        dbConnect.query(`SELECT * FROM ktl_users ORDER BY user_id DESC`, (err, result, fields)=>{
            if(err) return res.json({eerror: 'Could not get the users table'})
            res.json({response:{state: true, result }})
        })
})


// ktl users 

app.get('/ktl-announcement',userAuthMiddleWare, (req, res)=>{
    dbConnect.query(`SELECT * FROM ktl_announcement ORDER BY id DESC`, (err, result, fields)=>{
        if(err) return res.json({eerror: 'Could not get the announcement table'})
        res.json({response:{state: true, result }})
    })
})

// get all ktl frames 
app.get('/ktl-frames',userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_frames ORDER BY id DESC", function (err, result, fields) {
            if (err) throw err;
           res.json({response:{state:true, result}});
          });
    })
})


// ktl admin modify an exsisting job   *****************************************************

app.post('/admin/modify-job-status',adminAuthMiddleWare, (req,res)=>{
    console.log(req.body.status, ' the status')
    const dc = new Date()
    dbConnect.connect((err)=>{
        dbConnect.query(`UPDATE ktl_jobs SET job_status='${req.body.status}', completed_on='${dc.getFullYear() + '-'+dc.getDate()+'-'+dc.getDay() }' WHERE id=${req.body.id}`,function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:` User job with id  ${req.body.id} modified successfully`}});
          });
    })
})

// ktl admin grant upload permission
app.post('/admin/grant-upload-permision',adminAuthMiddleWare,(req,res)=>{
    const dc = new Date()
    const newReference = uuid.v4();
    dbConnect.connect((err)=>{
        dbConnect.query(`UPDATE ktl_jobs SET reference='${newReference}', file='', payment_status='completed', job_status='pending', upload_endpoint='/job-upload' WHERE id=${req.body.id}`,function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:` User job with id  ${req.body.id} modified successfully`}});
          });
    })
})

// ktl admin modify an exsisting frame properties 

app.post('/admin/modify-frame',adminAuthMiddleWare, (req,res)=>{
    let values = [
        req.body.status,
        parseInt(req.body.price)
    ]
    console.log(req.body.id, ' the id ')
    console.log(req.body.status, ' the status')
    dbConnect.connect((err)=>{
        dbConnect.query(`UPDATE ktl_frames SET status='${req.body.status}', price=${parseFloat(req.body.price)} WHERE id=${req.body.id}`, [values],function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:`frame with tag ${req.body.id} modified`}});
          });
    })
})

// ktl admin delete an exsisting frame properties 

app.post('/admin/delete-frame',adminAuthMiddleWare, (req, res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query(`DELETE FROM ktl_frames WHERE id=${req.body.id}`,function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:`frame with tag ${req.body.id} deleted successfully `}});
          });
    })
})


// ktl admin modify an exsisting photobook properties 

app.post('/admin/modify-cover', (req,res)=>{
    let values = [
        req.body.status,
        parseInt(req.body.price)
    ]
    console.log(req.body.id, ' the id ')
    console.log(req.body.status, ' the status')
    dbConnect.connect((err)=>{
        dbConnect.query(`UPDATE ktl_photobook_covers SET status='${req.body.status}', price=${parseFloat(req.body.price)} WHERE id=${req.body.id}`, [values],function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:` Photobook cover with tag number ${req.body.id} modified`}});
          });
    })
})

// ktl admin delete an exsisting photobook cover 

app.post('/admin/delete-cover', (req, res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query(`DELETE FROM ktl_photobook_covers WHERE id=${req.body.id}`,function (err, result, fields) {
            if (err) throw err;
           res.json({response: {state: true, message:` photobook cover with tag number  ${req.body.id} deleted successfully `}});
          });
    })
})



// ktl admin delete an exsisting size  *****************************************************************************
app.post('/admin/delete-size',adminAuthMiddleWare, (req, res)=>{
    let tablename;
    console.log(req.body.type, ' the main type ')
    switch (req.body.type) {
        case "ktl-photobook-sizes":
             dbConnect.connect((err)=>{
                dbConnect.query(`DELETE FROM ktl_photobook WHERE id=${req.body.id}`,function (err, result, fields) {
                    if (err) throw err;
                   res.json({response: {state: true, message:` photobook size with tag number  ${req.body.id} deleted successfully `}});
                  });
            })
        break;
        case "ktl-potrait-sizes":
             dbConnect.connect((err)=>{
                dbConnect.query(`DELETE FROM ktl_potrait WHERE id=${req.body.id}`,function (err, result, fields) {
                    if (err) throw err;
                   res.json({response: {state: true, message:` potrait size witht  tag number  ${req.body.id} deleted successfully `}});
                  });
            })
        break;
        case "ktl-enlargement-sizes":
             dbConnect.connect((err)=>{
                dbConnect.query(`DELETE FROM ktl_enlargment WHERE id=${req.body.id}`,function (err, result, fields) {
                    if (err) throw err;
                   res.json({response: {state: true, message:` enlargement size with id number   ${req.body.id} has been  deleted successfully `}});
                  });
            })        
        break;    
        default: 
        return;
    }
})

// get all photobook sizes 

app.get('/ktl-photobook-sizes',userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_photobook", function (err, result, fields) {
            if (err) throw err;
            res.json(result);
        });
    })
})

// get all enlargement sizes 
app.get('/ktl-enlargement-sizes',userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_enlargment", function (err, result, fields) {
            if (err) throw err;
           res.json(result);
          });
    })
})
// get all potrait sizes 
app.get('/ktl-potrait-sizes',userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_potrait", function (err, result, fields) {
            if (err) throw err;
           res.json(result);
          });
    })
})

// kings tymes add announcemnt
app.post('/ktl-send-support', userAuthMiddleWare,(req,res)=>{
    let values = [req.body.message, req.user.user_id,req.user.user_name, req.body.subject];
    dbConnect.query("INSERT INTO ktl_support(message, user_id, user_name, subject) VALUES(?)",[values], function (err, result, fields) {
        if (err) throw err;
        res.json({response: {
            state: true,
            message: "Support sent succussfully"
        }})
      });
})

// kings tymes add announcemnt
app.get('/ktl-get-support', userAuthMiddleWare,(req,res)=>{
    let values = [req.body.message, req.user.user_id, req.body.subject];
    dbConnect.query(`SELECT ktl_support.ticket,ktl_support.created_on,ktl_support.user_id,ktl_support.message,ktl_support.user_name,ktl_support.subject, ktl_reply_support.created_on as reply_date, ktl_reply_support.message as reply FROM  ktl_support LEFT JOIN ktl_reply_support ON ktl_support.ticket=ktl_reply_support.ticket WHERE ktl_support.user_id=${req.user.user_id} ORDER BY ktl_support.ticket DESC`, function (err, result, fields) {
        if (err) throw err;
        res.json({response: {
            state: true,
            result
        }})
      });
})
// // kings tymes add announcemnt
// app.get('/ktl-get-support', userAuthMiddleWare,(req,res)=>{
//     let values = [req.body.message, req.user.user_id, req.body.subject];
//     dbConnect.query(`SELECT * FROM  ktl_support WHERE user_id=${req.user.user_id} ORDER BY ticket DESC`, function (err, result, fields) {
//         if (err) throw err;
//         res.json({response: {
//             state: true,
//             result
//         }})
//       });
// })
// kings tymes add announcemnt
app.post('/admin/add-announcemnt',adminAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        let values = [req.body.message];
        dbConnect.query("INSERT INTO ktl_announcement(message) VALUES(?)",[values], function (err, result, fields) {
            if (err) throw err;
            res.json({response: {
                state: true,
                message: "Announcement added succussfully"
            }})
          });
    })
})

// kings tymes get all  announcemnts

app.get('/ktl-announcemnts', (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_announcement", function (err, result, fields) {
            if (err) throw err;
           res.json(result);
          });
    })
})

// kingstyme al photobook covers 
app.get('/ktl-photobook-covers',userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_photobook_covers", function (err, result, fields) {
            if (err) throw err;
            res.json({response:{state:true, result}});
          });
    })
})

// kings Tyme Admin Jobs status

app.get('/ktl-admin-jobs-status',adminAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query(`SELECT * FROM ktl_jobs`, function (err, result, fields) {
            if (err) throw err;
           res.json(result);
          });
    })
})
// Kings tyme users  jobs status 

app.get('/ktl-jobs-status', userAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query(`SELECT * FROM ktl_jobs WHERE user_id="${req.user.user_id}" ORDER BY id DESC`, function (err, result, fields) {
            if (err) throw err;
           res.json({response:{state: true, result}});
          });
    })
})

// ktl - delete job 

app.post('/ktl-delete-job', userAuthMiddleWare, (req, res)=>{
    dbConnect.query(`DELETE FROM ktl_jobs WHERE id=${req.body.id} AND user_id=${req.user.user_id}`, async(error, result, fields)=>{
        res.json({response:{state: true, message: `Job with id ${req.body.id} has been deleted successfully`}})
    })
})




// user  submit new job 
app.post('/submit-new-job',userAuthMiddleWare, async (req,res)=>{
    dbConnect.connect(async (err)=>{
        req.body.job_status = 'draft';
        req.body.payment_status = 'pending';

        let ktl_ref = uuid.v4()
        let values = [
            req.body.user_name,
            req.body.job_status,
            req.body.payment_status,
            req.body.user_phone,
            req.body.user_id,
            req.body.job_type,
            req.body.job_size,
            req.body.job_extra,
            req.body.copies,
            req.body.payment_method,
            req.body.bill,
            ktl_ref
        ];
        req.body.payment_method !== 'online' ? values.push('/dashboard/ktl-payment-detail') : values.push('')
        dbConnect.query(`INSERT INTO ktl_jobs(user_name,job_status,payment_status,user_phone,user_id,job_type,job_size,job_extra,copies,payment_method,bill, ktl_ref, payment_url) VALUES(?)`,[values], async function (err, result, fields) {
            if (err) return res.json({error:err});

            if (req.body.payment_method === 'offline') {
                try {
                    dbConnect.query('SELECT * FROM ktl_payment_detail', (err, result, fields )=>{
                        res.json({response: {state: true, detail:{offline_payment_detail:true}, data:result, result: req.body, ktl_ref}})
                    })
                } catch (error) {
                    res.json({response: {state: false}})

                }

            }else{
                await  axios.post('https://api.paystack.co/transaction/initialize', {amount:parseInt(req.body.bill)+100000, email: 'ojoxdan@gmail.com',ktl_ref, callback_url: 'http://localhost:4000/successful-checkout'}, {
                    headers:{
                        "authorization": "Bearer sk_test_5a9eeb39ea6b900406ee521ca423bc9c57df4c62",
                        "content-type": "application/json",
                        "cache-control" : "no-cache"
                    }
                }).then(async results=>{
                    let data = await results.data 
                    res.json({response: {state: true, data, detail:{online_payment_detail: true}, result: req.body, ktl_ref}})
                    
                }).catch(error=>{
                    res.json({error})
                })
            }
        });

        
        // res.json({result:values})
    })
})

// insert ktl ref 

app.post('/ktl-ref', (req, res)=>{
    let values = [req.body.access_code, req.body.authorized_url, req.body.reference]
    dbConnect.connect(()=>{
        dbConnect.query(`UPDATE ktl_jobs SET access_code='${req.body.access_code}', reference='${req.body.reference}', payment_url='${req.body.authorized_url}' WHERE ktl_ref='${req.body.ktl_ref}'`,[values], async function (err, result, fields) {
            if (err) return res.json({error:err});
            res.json({response: {state: true, data: req.body.ktl_ref}})
          });
    })
})

app.post('/profile',userAuthMiddleWare,(req,res)=>{
    dbConnect.connect((err)=>{
        let values = [req.body.username];
        dbConnect.query("SELECT * FROM ktl_users WHERE user_name=? ",[req.user.user_name], function (err, result, fields) {
            if (err) throw err;
           res.json(result)
          });
    })
})

// adminn: send message to user 
app.post('/admin/send-message',(req, res) => {
    let values = [
        req.body.user_id,
        req.body.subject,
        req.body.message
    ];

    dbConnect.query(`INSERT INTO ktl_user_message(user_id,subject,message) VALUES(?)`,[values], function (err, result, fields) {
        if (err) throw err;
      res.json({response: {
          state: true,
          message: "Message sent to user with user_id:"+req.body.user_id
      }})
      });

})


// admin: add size to size list
// ktl_photobook
// ktl_potrait
// ktl_enlargment
app.post('/admin/add-size',adminAuthMiddleWare,(req, res) => {
    let values = []
    switch (req.body.jobType) {
        case 'photobook':
            values = [
                req.body.size,
                req.body.price,
                req.body.discount,
                req.body.extra,
                req.body.type
            ]
            dbConnect.query(`INSERT INTO ktl_photobook(size,price,discount_price, extra_price, type) VALUES(?)`,[values], function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "new photobook size added"
                }})
            });
            break;
        case 'enlargement':
            values = [
                req.body.size,
                req.body.price,
                req.body.discount,
                req.body.extra,
            ]
            tablename = 'ktl_enlargment';
            dbConnect.query(`INSERT INTO ktl_enlargment(size,price,discount_price, extra_price) VALUES(?)`,[values], function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "new enlargement size added"
                }})
            });
            break;
        case 'potrait':
            values = [
                req.body.size,
                req.body.price,
                req.body.discount,
            ]
            tablename = 'ktl_potrait';
            dbConnect.query(`INSERT INTO ktl_potrait(size,price,discount_price) VALUES(?)`,[values], function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "new potrait size added"
                }})
            });
            break;
        default:
            return
    }
})

// admin update sizes 

{/* <option value="ktl-photobook-sizes">Photobook</option>
<option value="ktl-enlargement-sizes">Enlargement</option>
<option value="ktl-potrait-sizes">Potrait</option> */}

app.post('/admin/modify-size',adminAuthMiddleWare,(req, res) => {
    let values = []
    switch (req.body.type) {
        case 'ktl-photobook-sizes':
            dbConnect.query(`UPDATE ktl_photobook SET price=${parseFloat(req.body.price)}, discount_price=${req.body.discount}, extra_price=${req.body.extra} WHERE id=${req.body.id}`, function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "photobook size updated"
                }})
            });
            break;
        case 'ktl-enlargement-sizes':
            dbConnect.query(`UPDATE ktl_enlargment SET price=${parseFloat(req.body.price)}, discount_price=${req.body.discount}, extra_price=${req.body.extra} WHERE id=${req.body.id}`, function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "enlargement size updated"
                }})
            });
            break;
        case 'ktl-potrait-sizes':
            dbConnect.query(`UPDATE ktl_potrait SET price=${parseFloat(req.body.price)}, discount_price=${req.body.discount} WHERE id=${req.body.id}`,function (err, result, fields) {
                if (err) throw err;
                res.json({response: {
                    state: true,
                    message: "potrait size updated"
                }})
            });
            break;
        default:
            return
    }
})

// ------------------------------------------------------------------------Authentication --------------------------------
// -----------------------------------------------User Registration Authentication area ----------------------------------
// -----------------------------------------------------Register new user ------------------------------------------------

app.post('/register',[
    check('username', 'Please avoid space in between your choice of username ').not().custom(value => /\s/.test(value)),
    check('username', 'Please fill in the username field').not().isEmpty(),
    check('password','Please enter a a passord with at least 6 character').isLength({min:6}),
    check('address', 'Please enter your address').not().isEmpty(),
    check('phone', 'Please enter your phone number').not().isLength({max:11}),
    check('email', 'Please enter a valid email address').isEmail(),
], async (req,res)=>{
    const validatorErr = validationResult(req)
    if (!validatorErr.isEmpty()) {
       return res.json({errros: validatorErr.array()}) 
    }

    try {
        const salt = await bcryt.genSalt(10);
        req.body.password = await bcryt.hash(req.body.password, salt);
        dbConnect.connect((err)=>{
            // check if user already exists
            dbConnect.query(`SELECT user_name FROM ktl_users WHERE user_name='${req.body.username}'`, async function (err, result, fields) {
                if (err) throw err;
                // check if the user exists on the database
                if (result.length > 0) return res.json({error: 'a user has already registerd with this uername already '})
                let file = req.files.file;
                let fileName = file.name;
                let fileType = path.extname(fileName);

                let md5 = req.body.username+'-'+Date.now()+'-profile-image-'+file.md5;
                let URL = '/users-image/'+md5 + fileType
                await util.promisify(file.mv)("./ktl-assets"+URL);

                // when user does not exist register this new user
                let values = [req.body.username,req.body.password,req.body.address,req.body.phone,req.body.email,URL];
                dbConnect.query("INSERT INTO ktl_users(user_name,user_password, user_address, user_phone, user_email,user_image) VALUES(?)",[values], async function (err, result, fields) {
                    if (err) return res.json({response:{state:false, message:'sorry error occured, try again '}});
                    dbConnect.query(`SELECT * FROM ktl_users WHERE user_name='${req.body.username}'`, async(error, result, fields)=>{
                        if(error) return res.json({response:{state:false, message: 'Error occured, try to login now'}})
                        if (result.length > 0) {
                                const [RowDataPacket] = result 
                                const {user_name, user_password,user_id, user_address, user_phone, user_email, user_image} = RowDataPacket
                            jwt.sign({
                                user_name,
                                user_password,
                                user_id,
                                user_address,
                                user_phone,
                                user_email,
                                user_image
                            },'user-secret',async (error, token)=>{
                                if(error) return res.json({response:{state:false, message: 'sorry error occured, you were not authenticated'}})
                                return res.json({response:{state:true,token}})
                            })
                        }
                    })
                  });
              });
        })
    } catch (err) {
        res.json({errors: err+ ' Your registration attempt has faild please try again'})
    }
})




// Autheneticate users ----------------------------------------------------------------------------------------------------
//-----------------------------------------Check if the user is a valid one and get default data --------------------------
// ------------------------------------------------------------------------------------------------------------------------

app.get('/auth/user', (req, res)=>{
    if (req.header('x-auth-token')) {
        let token = req.header('x-auth-token');
        try {
            jwt.verify(token, 'user-secret', (err,userData)=>{
                if(err) return  res.json({error: `Token expired  `})
                // res.json({userData})
                dbConnect.query(`SELECT * FROM ktl_users WHERE user_name='${userData.user_name}'`, (error, result, fields)=>{
                    if (error) return  res.json({error: 'This is user is not found '})
                        res.json({response: {state: true, data:userData }})
                })

            })
        } catch (error) {
            res.status(401).json({error: error +' failed verification'})
        }
    }else{
        res.json({error: 'user not authenticated please login'})
    }
})


// user loging to dashboard ---------------------------------------------------------------------------------------------
// ___________________________only users allowed authentication area_____________________________________________________
// -----------------------------------------------------------------------------------------------------------------------

app.post('/login',[
    check('username', 'please enter a name ').not().isEmpty(),
    check('password', 'please enter a valid password').isLength({min:6})
],async (req,res)=>{
    let error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({errors: error.array()+'the main error is this '})
    }

    dbConnect.query("SELECT * FROM ktl_users WHERE user_name=? ",[req.body.username], async function (err, result, fields) {
        if (err) return res.json({error: error});
        if (result.length > 0) {
            const [RowDataPacket] = result 
            const {user_name, user_password,user_id, user_address, user_phone, user_email, user_image} = RowDataPacket
            const isCorrect = await bcryt.compare(req.body.password, user_password)
            if (isCorrect) {       
                jwt.sign({
                    user_id,
                    user_name,
                    user_email,
                    user_address,
                    user_phone, 
                    user_image
                }, 'user-secret',(error, token )=>{
                    res.json({response:{state: true, token}})
                })
            }else{
                res.json({response:{state: false, message: "Wrong username or password"}})
            }
        }else{
            res.json({response:{state: false, message: "Wrong username or password"}})
        }
    });

})




// Autheneticate Admin ----------------------------------------------------------------------------------------------------
//-----------------------------------------Check if the Admin is a valid one and get default data --------------------------
// ------------------------------------------------------------------------------------------------------------------------

app.get('/auth/admin', (req, res)=>{
    if (req.header('x-auth-token')) {
        let token = req.header('x-auth-token');
        try {
            jwt.verify(token, 'admin-secret', (err,adminData)=>{
                if(err) return  res.json({error: `Token expired  `})
                dbConnect.query(`SELECT * FROM ktl_admin WHERE admin_name='${adminData.admin_name}'`, (error, result, fields)=>{
                    if (error) return  res.json({error: 'This is user is not found '})
                        res.json({response: {state: true, data:adminData }})
                })

            })
        } catch (error) {
            res.status(401).json({error: error +' failed verification'})
        }
    }else{
        res.json({error: 'admin not authenticated please login'})
    }
})

// Amin loging to dashboard ---------------------------------------------------------------------------------------------
// ___________________________only users allowed authentication area_____________________________________________________
// -----------------------------------------------------------------------------------------------------------------------

app.post('/admin/login',[
    check('adminname', 'please enter a name ').not().isEmpty(),
    check('password', 'please enter a valid password').isLength({min:6})
],async (req,res)=>{
    let error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({errors: error.array()})
    }

    dbConnect.connect((err)=>{
        try {
            dbConnect.query("SELECT * FROM ktl_admin WHERE admin_name=? ",[req.body.adminname], async function (err, result, fields) {
                if (err) return res.json({error: error});
                
                const [RowDataPacket] = result 
                if (result.length > 0) {
                    const {admin_name, admin_password,admin_id, admin_address, admin_phone, admin_email} = RowDataPacket
                    const isCorrect = await bcryt.compare(req.body.password, admin_password)
                    if (isCorrect) {       
                        jwt.sign({
                            admin_id,
                            admin_name,
                            admin_email,
                            admin_address,
                            admin_phone, 
                        }, 'admin-secret',(error, token )=>{
                            res.json({response:{state: true, token}})
                        })
                    }else{
                        res.json({response:{state: false, message: "Wrong username or password"}})
                    }
                }else{
                    res.json({response:{state: false, message: "Wrong username or password"}})
                }
                // res.json({result})
            });
        } catch (error) {
            res.json(error)
        }
    })
})

// Admin get announcement
app.get('/admin/get-announcement', adminAuthMiddleWare, (req, res)=>{
    dbConnect.query(`SELECT * FROM ktl_announcement ORDER BY id DESC`, (err, result, fields)=>{
        if(err) return res.json({eerror: 'Could not get the announcement table'})
        res.json({response:{state: true, result }})
    })
})

// Admin delete announcement
app.post('/admin/delete-announcement', adminAuthMiddleWare, (req, res)=>{
    dbConnect.query(`DELETE FROM ktl_announcement WHERE id=${req.body.id}`, async(error, result, fields)=>{
        res.json({response:{state: true, message: `Announcement with id ${req.body.id} has been deleted successfully`}})
    })
})



// admin get  all ktl frames 
app.get('/admin/ktl-frames',adminAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_frames ORDER BY id DESC", function (err, result, fields) {
            if (err) throw err;
           res.json({response:{state:true, result}});
          });
    })
})

// kingstyme al photobook covers 
app.get('/admin/ktl-photobook-covers', adminAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_photobook_covers", function (err, result, fields) {
            if (err) throw err;
           res.json({response:{state:true, result}});
          });
    })
})


// Admin sizes modification ---------------------------------------------------------------------------------------------
// -----------------------------------------Modify the ktl sizes --------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------


// Admin get all photobook sizes --------------------------------------------------------------------------------------

app.get('/admin/ktl-photobook-sizes', adminAuthMiddleWare,(req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_photobook", function (err, result, fields) {
            if (err) throw err;
            res.json({response:{state:true, result}});
        });
    })
})

// Admin get all enlargement sizes  ------------------------------------------------------------------------------------------
app.get('/admin/ktl-enlargement-sizes',adminAuthMiddleWare, (req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_enlargment", function (err, result, fields) {
            if (err) throw err;
            res.json({response:{state:true, result}});
          });
    })
})
// Admin get all potrait sizes --------------------------------------------------------------------------------------------
app.get('/admin/ktl-potrait-sizes', adminAuthMiddleWare,(req,res)=>{
    dbConnect.connect((err)=>{
        dbConnect.query("SELECT * FROM ktl_potrait", function (err, result, fields) {
            if (err) throw err;
            res.json({response:{state:true, result}});
          });
    })
})


// admin get all support tymes add announcemnt
app.get('/admin/get-support',adminAuthMiddleWare,(req,res)=>{
    dbConnect.query(`SELECT ktl_support.ticket,ktl_support.created_on,ktl_support.user_id,ktl_support.message,ktl_support.user_name,ktl_support.subject, ktl_reply_support.created_on as reply_date, ktl_reply_support.message as reply FROM  ktl_support LEFT JOIN ktl_reply_support ON ktl_support.ticket=ktl_reply_support.ticket  ORDER BY ktl_support.ticket DESC`, function (err, result, fields) {
        if (err) throw err;
        res.json({response: {
            state: true,
            result
        }})
      });
})


app.get('/support',(req,res)=>{
    dbConnect.query(`SELECT ktl_support.*, ktl_reply_support.message as reply FROM  ktl_support JOIN ktl_reply_support ON ktl_support.ticket=ktl_reply_support.ticket ORDER BY ktl_support.ticket DESC`, function (err, result, fields) {
        if (err) throw err;
        res.json({response: {
            state: true,
            result
        }})
      });
})


// admin reply support 
app.post('/admin/reply-support',(req,res)=>{
    let values = [req.body.message, req.body.userId,req.body.userName,req.body.ticket];
    dbConnect.query("INSERT INTO ktl_reply_support(message, user_id, user_name, ticket) VALUES(?)",[values], function (err, result, fields) {
        if (err) throw err;
        res.json({response: {
            state: true,
            message: "Support reply succussfully"
        }})
      });
})

// Admin statistics 
app.get('/admin/stats', (req,res)=>{
    dbConnect.connect(async(err)=>{
        let numbers = {}
        dbConnect.query("SELECT id FROM ktl_jobs", function (err, result, fields) {
            if (err) throw err;
           numbers.jobs = result.length
           dbConnect.query("SELECT user_id FROM ktl_users", function (err, result, fields) {
                if (err) throw err;
                numbers.users = result.length
                dbConnect.query("SELECT ticket FROM ktl_support", function (err, result, fields) {
                    if (err) throw err;
                    numbers.support = result.length
                    let dd = new Date()
                    let td = dd.getFullYear() + '-'+(parseInt(dd.getUTCMonth())+1)
                    dbConnect.query(`SELECT id FROM ktl_jobs WHERE added_on LIKE '${td}%'`, function (err, result, fields) {
                        if (err) throw err;
                        numbers.jobsToday = result.length
                        res.json({response: {state:true, numbers}})
        
                    });
    
                });

            });

        });
    })
})

// ktl - user successful payment handled 

app.get('/successful-checkout', (req, res)=>{
    let query = req.query
    dbConnect.query(`UPDATE ktl_jobs SET payment_method='online', upload_endpoint='/dashboard-upload',payment_status='completed' WHERE reference='${query.reference}'`, async function (err, result, fields) {
        if (err) return res.json({error:err});
        res.redirect(`http://localhost:3000/dashboard/upload-job/${query.reference}`)
      });
    // res.json({result: req.query})
})

// Upload a new job 
// upload-job/reference
app.post('/dashboard/upload-job/:reference',userAuthMiddleWare, (req, res)=>{
    dbConnect.query(`SELECT * FROM ktl_jobs WHERE reference='${req.params.reference}' AND payment_status='completed' AND user_id='${req.user.user_id}'`,(error, result, fields)=>{
        if(error) return res.json({error: 'Sorry You have not '})
       if (result.length > 0) {
           if (result[0]) {
            if (result[0].file) {
                delete result[0].upload_endpoint
                console.log(result[0])
                res.json({response: {state:true, result}})
            }else{
                res.json({response: {state:true, result}})
    
            }
           }else{
               res.json({response:{state:true, message: 'job found'}})
           }
       }else{
           res.json({response:{state:true, message: 'job found'}})
       }
    } )
})
// paystack testing 
app.post('/ktl-checkout',userAuthMiddleWare, async (req, res)=>{
   await  axios.post('https://api.paystack.co/transaction/initialize', {amount:req.body.jobBill, email: 'ojoxdan@gmail.com', callback_url: 'http://localhost:4000/successful-checkout'}, {
        headers:{
            "authorization": "Bearer sk_test_5a9eeb39ea6b900406ee521ca423bc9c57df4c62",
            "content-type": "application/json",
            "cache-control" : "no-cache"
        }
    }).then(async result=>{
        let data = await result.data 
        res.json({response: {state: true, data, bill: req.body.jobBill + 1000}})
    }).catch(error=>{
        res.json({error})
    })
})

if (process.env.NODE_ENV === "production") {
    app.use(express.static('build'))
    app.get('*', (req, res)=> res.sendFile(path.resolve(__dirname, 'build', 'index.html')))
}


const PORT =  process.env.PORT || 4000
server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}` );
})