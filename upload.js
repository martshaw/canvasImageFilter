/* global MegaPixImage: true, createjs: true */


(function(window, document){
    'use strict';

    var EVENT = (typeof window.ontouchstart === 'undefined') ? 'click' : 'touchend';
    var imageLoader = document.getElementById('file');
    var canvas = document.getElementById('imgCan');
    var ctx = canvas.getContext('2d');
    var CANVAS_SIZE = 710;
    var coeffic;
    var image = new Image();
    var image2;
    var image2bw;
    var xLast = 0;
    var yLast = 0;
    var stage = new createjs.Stage(canvas);
    var cn2 = document.createElement('canvas');
    cn2.width = cn2.height = CANVAS_SIZE;
    var ctx2 = cn2.getContext('2d');

    if (createjs.Touch.isSupported()) { createjs.Touch.enable(stage); }
    function resizeImage(img) {
        var icanvas = document.createElement('canvas');
        icanvas.width = icanvas.height = CANVAS_SIZE;
        var ictx = icanvas.getContext('2d');
        var w, h;
        if (coeffic < 1) {
            w = CANVAS_SIZE;
            h = CANVAS_SIZE / coeffic;
        } else {
            w = CANVAS_SIZE * coeffic;
            h = CANVAS_SIZE;
        }
        var t = 0;
        var l = 0;
        if (w < h) {
            t = -(h - CANVAS_SIZE) / 2;
        } else {
            l = -(w - CANVAS_SIZE) / 2;
        }
        ictx.drawImage(img, l, t, w, h);
        return icanvas;
    }
    function rotateImage(img, rotate) {
        var icanvas = document.createElement('canvas');
        icanvas.width = icanvas.height = CANVAS_SIZE;
        var ictx = icanvas.getContext('2d');
        ictx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        ictx.rotate(rotate * Math.PI / 180);
        ictx.drawImage(img, -CANVAS_SIZE / 2, -CANVAS_SIZE / 2, CANVAS_SIZE, CANVAS_SIZE);
        return icanvas;
    }
    function rGBtoGRAYSCALE(r, g, b) {
        return ((0.2125 * r) + (0.7154 * g) + (0.0721 * b)) || 0;
    }
        /** borrowed **/
    function desaturate(ctx) {
        var imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE),
            n = 0;
        for (var y = 0; y < CANVAS_SIZE; y++) {
            for (var x = 0; x < CANVAS_SIZE; x++) {
                var i = (y * CANVAS_SIZE + x) * 4;
                n++;
                imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] =  rGBtoGRAYSCALE(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]);
            }
        }
        return imgData;
    }
    function desaturateImage(img) {
        var icanvas = document.createElement('canvas');
        icanvas.width = icanvas.height = CANVAS_SIZE;
        var ictx = icanvas.getContext('2d');
        ictx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        var data = desaturate(ictx);
        ictx.putImageData(data, 0, 0, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        return icanvas;
    }
    function addImage(){
        image = new Image();
        //specify image filter src
        image.src = '';
        ctx.globalAlpha = 1;
        ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        //draw();
    }
    function draw() {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        if (image) {
            ctx.globalAlpha = 1;
            ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
        if (image2) {
            ctx.globalAlpha = 1;
            ctx2.globalAlpha = 1;
            ctx2.drawImage(image2bw, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx2.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.drawImage(cn2, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
        if (image && image2) {
            $('#imgUpload').val(canvas.toDataURL('image/jpeg', 0.7));
        }
    }
    var enableDrag = function(src) {
        var crImg = new createjs.Bitmap(src);
        var dragger = new createjs.Container();
        dragger.x = dragger.y = 0;
        dragger.addChild(crImg);
        stage.addChild(dragger);

        dragger.on('pressmove', function(evt) {
            // find current location on screen
            var xScreen = stage.x - evt.stageX;
            var yScreen = stage.y - evt.stageY;

            var xNew = xScreen + xLast;
            var yNew = yScreen + yLast;

            evt.currentTarget.x = xNew;
            evt.currentTarget.y = yNew;

            xLast = xScreen;
            yLast = yScreen;
            // make sure to redraw the stage to show the change:
            stage.update();
        });
        stage.update();
    };
    function handleImage(e){
        var file = e.target.files[0],
        reader = new FileReader();
        reader.onloadend = function(){
            image2 = new Image();
            image2.onload = function() {
                coeffic = image2.width / image2.height;
                $('#file').fileExif(function (exif) {
                    var c = document.createElement('canvas');
                    c.width = c.height = CANVAS_SIZE;
                    var mpImg = new MegaPixImage(image2);
                    mpImg.onrender = function () {
                        image2 = c;
                        image2 = resizeImage(image2);
                        if (exif) {
                            if (exif.Orientation === 5 || exif.Orientation === 6) {
                                image2 = rotateImage(image2, 90); //rotate 90 cw
                            }
                            if (exif.Orientation === 7 || exif.Orientation === 8) {
                                image2 = rotateImage(image2, -90); //rotate 90 ccw
                            }
                            if (exif.Orientation === 3 || exif.Orientation === 4) {
                                image2 = rotateImage(image2, 180); //rotate 180
                            }
                        }

                        image2bw = desaturateImage(image2);
                        draw();
                    };
                    mpImg.render(c, { maxWidth: CANVAS_SIZE, maxHeight: CANVAS_SIZE});

                });
            };
            image2.src = reader.result;
            enableDrag(image2.src);
        };
        reader.readAsDataURL(file);

    }

    $('#crop').on(EVENT, function(event){
        event.preventDefault();
        var canvas = document.getElementById('canvasThumbResult');
        var context = canvas.getContext('2d');
        var img = document.getElementById('imgCan'),
            $img = $(img),
            imgW = img.width,
            imgH = img.height;

        var ratioY = imgH / $img.height(),
            ratioX = imgW / $img.width();

        var getX = 0 * ratioX,
            getY = 0 * ratioY,
            getWidth = 402 * ratioX,
            getHeight = 400 * ratioY;
        addImage();
        context.drawImage(img,getX,getY,getWidth,getHeight,0,0,320,320);
    });

    function init() {
        imageLoader.addEventListener('change', handleImage, false);
        addImage();
    }

    function submitImage() {
      //Program a custom submit function for the form
        $('form#imgTextForm').submit(function(event){
            //disable the default form submission
            event.preventDefault();

            //grab all form data
            var formData = new FormData($(this)[0]);
            $.ajax({
                url: 'http://52.69.146.248:18070/api/jordan-30-offline/',
                type: 'POST',
                data: formData,
                async: false,
                cache: false,
                contentType: false,
                processData: false,
                success: function (data, textStatus, xhr) {
                    console.log('success', data, textStatus, xhr);
                }
            });
            return false;
        });
    }
    init();
    submitImage();
})(window, document);