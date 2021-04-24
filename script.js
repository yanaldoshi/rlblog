var slide;
var value_text;
var numsteps;
var sleep_val=100;
var epsilon;


var decay_rate = 0.9;
var episodes = 50;
var max_steps = 100;
var lr = 0.8;
var gamma = 0.9;

var e = 0;
var curr_pos = 0;
var rwd = 0;

var qtab = new Array(16);
var action_map = {
    0: -1,
    1: 4,
    2: 1,
    3: -4,
};

var action_map1 = {
    0: "LEFT",
    1: "BOTTOM",
    2: "RIGHT",
    3: "UP",
};

var content_map = ["home", "qlearning"];
var content_map1 = ["homebtn", "qlbtn"];



window.onload = function() {

    slide = document.getElementById("eslide");
    epslide = document.getElementById("epslide");
    dcslide = document.getElementById("decayslide");

    value_text = document.getElementById("numsteps");
    value_text.innerText = "Number of Episodes for the run: " + slide.value;
    numsteps = parseInt(slide.value);

    ep_text = document.getElementById("epval");
    ep_text.innerText = "Epsilon value: " + epslide.value;
    epsilon = parseFloat(epslide.value);

    dc_text = document.getElementById("decayval");
    dc_text.innerText = "Epsilon Decay Rate per 10 episodes: "+dcslide.value;
    decay_rate = parseFloat(dcslide.value);

    slide.oninput = function() {
        value_text.innerText = "Number of Episodes for the run: " + slide.value;
        numsteps = parseInt(this.value);
    }

    epslide.oninput = function() {
        ep_text.innerText = "Epsilon value: "+epslide.value;
        epsilon = parseFloat(epslide.value);
    }

    dcslide.oninput = function() {
        dc_text.innerText = "Epsilon Decay Rate per 10 episodes: " + dcslide.value;
        decay_rate = parseFloat(dcslide.value);
    }
    reset();
}

function reset() {
    for(i=0;i<qtab.length;i++) {
        qtab[i] = [0,0,0,0];
    }
    var frozen_parts = [1,2,3,4,6,8,9,10,13,14];
    var container = document.getElementById("lake");
    container.getElementsByClassName("cell")[0].innerText = "S\n"+qtab[0][0]+"\nLEFT";
    container.getElementsByClassName("cell")[15].innerText = "G";
    for(i = 1; i < 15; i++) {
        var cell = container.getElementsByClassName("cell")[i];
        if(frozen_parts.includes(i)) {
            cell.innerText = "F\n"+qtab[Math.floor(i/4)][i%4]+"\nLEFT";
        } 
        else {
            //cell.innerText = "H\n"+qtab[Math.floor(i/4)][i%4]+"\nLEFT";
            cell.innerText = "H";
        }
        cell.style.setProperty("background-color", "white");
    }

    document.getElementById("eslide").value = "1";
    document.getElementById("numsteps").innerText = "Number of Episodes in the run : 1";
    numsteps = 1;
    
    document.getElementById("epslide").value = "0.5";
    document.getElementById("epval").innerText = "Epsilon value: 0.5";
    epsilon = 0.5;

    document.getElementById("decayslide").value = "0.30";
    document.getElementById("decayval").innerText = "Epsilon Decay Rate per 10 episodes: 0.30";
    decay_rate = 0.30;

    document.getElementById("episodes").innerText = "Episodes done: 0";
    e = 0;


}

function bounceBack(curr_pos, next_pos) {
    var status1 = curr_pos==3 || curr_pos==7 || curr_pos==11 || curr_pos==15;
    var status2 = curr_pos==4 || curr_pos==8 || curr_pos==12;
    if(status1) {
        if(next_pos == curr_pos + 1) return true;
    }
    else if(status2) {
        if(next_pos == curr_pos - 1) return true;
    }
    return false;
}

function getAct(obs) {
    if(Math.random() < epsilon) {
        return Math.floor(Math.random()*obs.length);
    }
    else {
    return obs.indexOf(Math.max(...obs));
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
 }

function clearLake() {
    var container = document.getElementById("lake");
    var cells = container.getElementsByClassName("cell");

    for(i = 0; i<cells.length; i++) {
        cells[i].style.setProperty("background-color", "white");
    }
}


async function run_episodes() {
    if (numsteps > 5) {
        sleep_val = 50;
    }
    else if(numsteps > 10) {
        sleep_val = 20;
    }
    else if(numsteps > 20) {
        sleep_val = 10;
    }
    else {
        sleep_val = 300;
    }
    for(k=0; k<numsteps; k++){
        rwd=0;
        var container = document.getElementById("lake");
        var cells = container.getElementsByClassName("cell");
        if(e % 10 == 0) epsilon = epsilon*decay_rate;
        var done = false;
        //console.log("here");
        while(!done) {
            valid = false;
            while(!valid) {
            act = getAct(qtab[curr_pos]);
            delta = action_map[act];
            next_pos = curr_pos + delta;
            if(!bounceBack(curr_pos, next_pos) && (next_pos >= 0 && next_pos <= 15)) valid = true;
            }
            if(cells[next_pos].innerText == "H") {
                cells[curr_pos].style.setProperty("background-color", "white");
                cells[next_pos].style.setProperty("background-color", "red");
                //console.log("Fell at: " + next_pos);
                curr_pos = 0;
                done = true;
                //console.log("Reward: " + rwd);
                rwd = 0;
                await sleep(sleep_val);
                clearLake();
            }
            else if (container.getElementsByClassName("cell")[next_pos].innerText == "G") {
                cells[curr_pos].style.setProperty("background-color", "white");
                cells[next_pos].style.setProperty("background-color", "green");
                //console.log("Goal reached");
                done=true;
                rwd++;
                qtab[curr_pos][act] = qtab[curr_pos][act] + lr*(1 + gamma*Math.max(...qtab[next_pos]) - qtab[curr_pos][act]);
                var cell = cells[curr_pos].innerText;
                cells[curr_pos].innerText = cell[0] + "\n" + Math.max(...qtab[curr_pos]).toFixed(2) + "\n" + action_map1[qtab[curr_pos].indexOf(Math.max(...qtab[curr_pos]))];
                rwd = 0;
                //console.log("Value upd to: "+qtab[curr_pos][act]);
                curr_pos=0;
                await sleep(sleep_val);
                clearLake();
            }
            else {
                //console.log("Step to: " + next_pos);
                cells[next_pos].style.setProperty("background-color", "lightblue");
                cells[curr_pos].style.setProperty("background-color", "white");
                qtab[curr_pos][act] = qtab[curr_pos][act] + lr*(gamma*Math.max(...qtab[next_pos]) - qtab[curr_pos][act]);
                var cell = cells[curr_pos].innerText;
                cells[curr_pos].innerText = cell[0] + "\n" + Math.max(...qtab[curr_pos]).toFixed(2) + "\n" + action_map1[qtab[curr_pos].indexOf(Math.max(...qtab[curr_pos]))]; 
                curr_pos = next_pos;
            }
            await sleep(sleep_val);
        }
        e++;
        document.getElementById("episodes").innerText = "Episodes done: "+e;
    }
}


function displayContent(id) {

    for(i=0; i<content_map.length; i++) {
        document.getElementById(content_map[i]).style.display = "none";
        document.getElementById(content_map1[i]).style.setProperty("background-color","#d6b951");
        document.getElementById(content_map1[i]).style.setProperty("color", "white");
    }

    document.getElementById(content_map[id]).style.display = "block";
    document.getElementById(content_map1[id]).style.setProperty("background-color", "white");
    document.getElementById(content_map1[id]).style.setProperty("color", "black");
}

