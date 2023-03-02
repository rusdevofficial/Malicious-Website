function verbose(label, message){
    if(!window.top.location.href.includes("tmzr_debug")&&!window.top.location.href.includes("tmzr_corner")){}
    console.log('%cThe Moneytizer - '+label, 'color: white; background: #ec144c;border-radius: 3px; padding: 2px', message);
}

verbose('Corner video', 'Initialized lib');

window.setupCornerVideo = function(args){
    verbose('Corner video', 'Setting up 80234');
    verbose('Corner video - args list', args);
    if(args.bidder==="teads"){
        var player_container = document.createElement("div");
        player_container.id = '80234';
    } else {
        var player_container = document.createElement("iframe");
        player_container.id = '80234';
    }


    var css = '.teads-ui-components-label { display:none; }',
    style = document.createElement('style');
    player_container.appendChild(style)
    style.type = 'text/css';
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    verbose('Corner video', 'Creating container');

    var sas_container_80234 = document.createElement("div");
    sas_container_80234.id = 'sas_container_80234'
    sas_container_80234.setAttribute("style","width: 300px; position: fixed; right: 20px; bottom: 20px; z-index: 99999; max-width: 60vw");
    sas_container_80234.appendChild(player_container);
    document.body.appendChild(sas_container_80234);

    var sas_relative_container_80234 = document.createElement("div");
    sas_relative_container_80234.id = 'sas_relative_container_80234'
    sas_relative_container_80234.setAttribute("style","position: relative;");
    sas_relative_container_80234.appendChild(player_container);
    sas_container_80234.appendChild(sas_relative_container_80234);

    var sas_80234_cross = document.createElement("div");
    sas_80234_cross.id = 'sas_80234_cross';
    sas_80234_cross.innerHTML = '<img id="sas_80234_cross_ico" style="width:50px;" src="https://ced-ns.sascdn.com/diff/templates/images/close-retina.png"/> ';
    if(args.bidder==="teads"){
        sas_80234_cross.setAttribute("style", "cursor: pointer; position: absolute; right: -30px; top: -30px; z-index: 99999;");
    } else {
        sas_80234_cross.setAttribute("style", "cursor: pointer; position: absolute; right: -30px; top: -30px; z-index: 99999;display:none");
    }
    sas_relative_container_80234.appendChild(sas_80234_cross)

    verbose('Corner video', 'Generating closing event');

    document.addEventListener('click',function(e){
        if(typeof String().startsWith != 'function'){
            return;
        }

        if(e.target.id.startsWith("sas_80234_cross")||e.target.id.startsWith("sas_80234_cross_ico")){
            window.adsArea80234.isVisible = false;
            window.adsArea80234.isClosed = true;
            window.adsArea80234.refreshRate = 99**9;
            document.getElementById("80234").innerHTML = "";
            document.getElementById("sas_80234_cross_ico").innerHTML = "";
            e.target.remove();
            verbose("Corner video", "Corner video closed");
        }

    });

    verbose('Corner video', 'Rendering ads');
    if(!args.noRender){
        if(args.bidder==="teads"){
            args.func(args.iframeDoc, args.hb_adid);
        } else {
            let cornerIframeDoc = document.getElementById("80234").contentWindow.document;
            args.func(cornerIframeDoc, args.hb_adid);
        }
    }
}