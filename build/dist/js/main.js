// view image buttons 
let frontViewImgBtn = document.querySelector('#front-view-img-btn')
let backViewImgBtn = document.querySelector('#back-view-img-btn')
let interiorViewImgBtn = document.querySelector('#interior-view-img-btn')

// view image files 
let frontViewFile = document.querySelector('#front-view-file')
let backViewFile = document.querySelector('#back-view-file')
let interiorViewFile = document.querySelector('#interior-view-file')

// preivew view images 
let interiorViewImg = document.querySelector('#interior-view-img')
let backViewImg = document.querySelector('#back-view-img')
let frontViewImg = document.querySelector('#front-view-img')

// handle event listeneres 

// front view image preview events 
frontViewImgBtn.addEventListener('click', ()=>{
    frontViewFile.click()
    frontViewFile.addEventListener('input', (e)=>{
        let file = e.target.files[0]
        if (e.target.files.length  > 0) {
            if (/image/.test(file.type)) {
                let reader = new FileReader()
                reader.addEventListener('load', (file)=>{
                    frontViewImg.src = file.target.result
                })
                reader.readAsDataURL(file)
            }else{
                frontViewImg.removeAttribute('src');
            }
        }else{
            frontViewImg.removeAttribute('src');
        }
    })
})

// back view image preview events 
backViewImgBtn.addEventListener('click', ()=>{
    backViewFile.click()
    backViewFile.addEventListener('input', (e)=>{
        let file = e.target.files[0]
        if (e.target.files.length  > 0) {
            if (/image/.test(file.type)) {
                let reader = new FileReader()
                reader.addEventListener('load', (file)=>{
                    backViewImg.src = file.target.result
                })
                reader.readAsDataURL(file)
            }else{
                backViewImg.removeAttribute('src');
            }
        }else{
            backViewImg.removeAttribute('src');
        }
    })
})

// interior view image preview events 
interiorViewImgBtn.addEventListener('click', ()=>{
    interiorViewFile.click()
    interiorViewFile.addEventListener('input', (e)=>{
        let file = e.target.files[0]
        if (e.target.files.length  > 0) {
            if (/image/.test(file.type)) {
                let reader = new FileReader()
                reader.addEventListener('load', (file)=>{
                    interiorViewImg.src = file.target.result
                })
                reader.readAsDataURL(file)
            }else{
                interiorViewImg.removeAttribute('src');
            }
        }else{
            interiorViewImg.removeAttribute('src');
        }
    })
})
