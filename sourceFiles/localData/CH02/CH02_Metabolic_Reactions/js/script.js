$(function() {
  resize();
  $(window).resize(resize);

  function resize() {
    $('html').css('fontSize', $('body').width() / 50 + "px")
  }

  checkButton();
  setupVideo();

  resize();
  $(window).resize(resize);
});

var urlVars = getUrlVars();
var progress = new Progress(urlVars["local"]);

function setupVideo(){

  AdobeEdge.loadComposition('cell', 'EDGE-40303185', {
   scaleToFit: "both",
   centerStage: "horizontal",
   minW: "0px",
   maxW: "undefined",
   width: "550px",
   height: "400px",
   bScaleToParent: true
}, {dom: [ ]}, {dom: [ ]});

}

function replay(){
  var symbol = AdobeEdge.getComposition("EDGE-40303185").getStage().getSymbol("Stage");
  var position = symbol.getPosition();
  var timelength = symbol.getDuration();

if (position != timelength){
  if(symbol.isPlaying()){
    symbol.stop(position);
    symbol.$("cell2")[0].pause();
  }else{
  symbol.play(position);
  symbol.$("cell2")[0].play();
  }
}else{
  symbol.play(0);
  symbol.$("cell2")[0].currentTime = 0;
  symbol.$("cell2")[0].play();
}

}


function setCompleted() {
  progress.setKey(urlVars["key"], "done");

  if (urlVars["testing"] == "true") {
    console.log('\n' + "----------Key----------")
    console.log(progress.getKey(urlVars["key"]), urlVars["key"]);
    console.log("----------Key----------" + '\n')
  }

  window.parent.updateCompletion();
  $('#playButton').css("background-color","#2ab673");
  $('#playButton').html("Replay Video")
}

function checkButton(){
  if(progress.getKey(urlVars["key"]) == "done"){
    $('#playButton').css("background-color","#2ab673");
    $('#playButton').html("Replay Video")
  }else{
    $('#playButton').css("background-color","ed1c24");
    $('#playButton').html("Play Video To Complete Page")
  }
}
