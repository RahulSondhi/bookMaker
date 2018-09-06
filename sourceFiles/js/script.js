var state={}
state.chapters = [];
state.chapterList=[]
state.lookup={}
var testing = false;
var clearLocalStorage = false;
var hideSpeed=0;
var refreshInterval = -1;

var currentPage = {
  chapterID: 0,
  quizID: 0
}

var isFullScreen = false;

var canShowOverlay = false;
var showingOverlay = false;
var debug = false;
var progress;
var zero = false;
var numbers = true;

// Called on page load.
$(function() {

  if (clearLocalStorage) {
    localStorage.clear();
    console.log("Cleared for Testing!")
  }

  $.getJSON("module.json", function(data) {
    module = data;
    progress = new Progress(module.localStorageKey);
    loadModule(module);
  }).fail(function(jqxhr, textStatus, error) {
    var err = textStatus + ", " + error;
    console.log("Request Failed: " + err);
  });;

  $("#buttonPrevious").click(function() {
    nextPage(-1);
  });

  $("#buttonNext").click(function() {
    nextPage(1);
  });

  $("#gradingInfo").click(function() {
    showGrades();
  });

  $("#fullScreenButton").click(function() {
    var userAgent = window.navigator.userAgent;
    if (isFullScreen) {
      // setFullScreen(false);
      exitFullscreen();
      if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        isFullScreen = false;
      }
    } else {
      launchFullscreen();
      if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        isFullScreen = true;
      }
    }
  });

  $(document).keydown(function(e) {
    switch (e.which) {
      case 37: // left
        $("#buttonPrevious").click();
        break;

      case 39: // right
        $("#buttonNext").click();
        break;

      default:
        return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  });

});

// Find the right method, call on correct element
function launchFullscreen() {
  var i = document.getElementById("contentLoader");
  if (i.requestFullscreen) {
    i.requestFullscreen();
  } else if (i.mozRequestFullScreen) {
    i.mozRequestFullScreen();
  } else if (i.webkitRequestFullscreen) {
    i.webkitRequestFullscreen();
  } else if (i.msRequestFullscreen) {
    i.msRequestFullscreen();
  } else {
    var w = $(window).width();
    var h = $(window).height();

    var aw = $("#contentLoader").width();
    var ah = $("#contentLoader").height();
    // If the aspect ratio is greater than or equal to 4:3, fix height and set width based on height
    if ((w / h) >= 4 / 3) {
      stageHeight = h;
      stageWidth = (4 / 3) * h;
    }
    // If the aspect ratio is less than 4:3, fix width and set height based on width
    else {
      stageWidth = w;
      stageHeight = (3 / 4) * w;
    }

    var shiftw = (stageWidth / 2);
    var shifth = (stageHeight / 2);

    $("#content").css("transform", "scale(" + stageWidth / aw + ", " + stageHeight / ah + ")");
    $("#content").css({
      "left": "7.5%",
      "top": "7.5%"
    })
    $("#headerContent").css("visibility", "hidden");
  }

  $("#fullScreenButton").removeClass("anim_fullScreenButtonOut");
  $("#fullScreenButton").addClass("anim_fullScreenButtonIn");
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else {
    iosExitFullscreen();
  }
  $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
  $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
  resizeWindow();
}

function iosExitFullscreen() {
  $("#content").css({
    "transform": "scale(1, 1)"
  });
  $("#content").css({
    "left": "15%",
    "top": "5%"
  })

  $("#headerContent").css("visibility", "visible");
}

function dumpFullscreen() {
  console.log("document.fullscreenElement is: ", document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  console.log("document.fullscreenEnabled is: ", document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled);
}

// Events
document.addEventListener("fullscreenchange", function(e) {
  console.log("fullscreenchange event! ", e);

  if (isFullScreen) {
    $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
    $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
    isFullScreen = false;
  } else {
    isFullScreen = true;
  }
});
document.addEventListener("mozfullscreenchange", function(e) {
  console.log("mozfullscreenchange event! ", e);

  if (isFullScreen) {
    $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
    $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
    isFullScreen = false;
  } else {

    isFullScreen = true;
  }
});
document.addEventListener("webkitfullscreenchange", function(e) {
  console.log("webkitfullscreenchange event! ", e);

  if (isFullScreen) {
    $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
    $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
    isFullScreen = false;
  } else {

    isFullScreen = true;
  }
});
document.addEventListener("msfullscreenchange", function(e) {
  console.log("msfullscreenchange event! ", e);

  if (isFullScreen) {
    $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
    $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
    isFullScreen = false;
  } else {

    isFullScreen = true;
  }
});

// Set full screen
function setFullScreen(bool) {
  isFullScreen = bool;
  if (isFullScreen) {
    $("#content").removeClass("anim_fullScreenOff");
    $("#content").addClass("anim_fullScreenOn");
    $("#headerContent").removeClass("anim_quickFadeIn");
    $("#headerContent").addClass("anim_quickFadeOut");
    $("#fullScreenButton").removeClass("anim_fullScreenButtonOut");
    $("#fullScreenButton").addClass("anim_fullScreenButtonIn");
  } else {
    $("#content").removeClass("anim_fullScreenOn");
    $("#content").addClass("anim_fullScreenOff");
    $("#headerContent").removeClass("anim_quickFadeOut");
    $("#headerContent").addClass("anim_quickFadeIn");
    $("#fullScreenButton").removeClass("anim_fullScreenButtonIn");
    $("#fullScreenButton").addClass("anim_fullScreenButtonOut");
  }
}



// Loads the module m into the view.
function loadModule(m) {
  // Clear sidebar
  clearSidebar();
  zero = m.zero;
  numbers = m.numbers;
  // Create sidebar thumbnails
  state.chapters= m.chapters;

  for (var i = 0; i < m.chapters.length; i++) {
    // For each chapter...

    state.chapters[i].expanded=false;
    //initChapter(m.chapters[i]);
    // Make chapter thumbnail
    makeThumbnail(m.chapters[i], [i+1]);
    // Make page thumbnails
    for (var j = 0; j < m.chapters[i].pages.length; j++) {
      makeThumbnail(m.chapters[i].pages[j], [i+1, j+1]);
      if(m.chapters[i].pages[j].subPages){
        for (var k = 0; k < m.chapters[i].pages[j].subPages.length; k++) {
            makeThumbnail(m.chapters[i].pages[j].subPages[k],[ i+1, j+1,k+1]);
        }
      }
    }
  }

$(".thumb").on("click",function(evt){


//
//     var [,i,j] = evt.currentTarget.id.split("_");
// //    console.log(i,j)
// //console.log(evt.currentTarget.id)
//
//     currentPage.chapterID = i;
//     currentPage.quizID = j;
//     setContent(state.chapters[i].pages[j-1], i, j);
//     $("#thumb_" + i + "_" + (j+1)).attr("clicked", true)
//     updateCompletion();
var stem=$(evt.currentTarget).attr("id").split("_");

//Setting the currentPage chapterID and QuizID based on the clicked thumb for
//later usage with next page and previous page
currentPage.chapterID = stem.slice(1,2)-1;
if(stem.slice(1).length==2){
  currentPage.quizID=(stem.slice(2,3)-1)+1;
}

setContent(stem.slice(1).join("_"))

  var branchClicked = "#thumbBox_"+$(evt.currentTarget).parent().attr("id").split("_")[1]


 $(".thumbBox").each(function(idx,val){
   var searchBranch= "#thumbBox_"+$(val).attr("id").split("_")[1]
   if($(searchBranch).attr("id")!=$(branchClicked).attr("id")){
   //  console.log($(val).attr("id"),$(branchClicked).attr("id"))
   //  possibility one: make the subpages disapear before hidden
   $(val).find(".thumbBox").hide(hideSpeed);

  }
})

 var clickedItemSiblings= $(evt.currentTarget).parent().find('>  .thumbBox');

// var menuChildren =$(thumbClicked).parent().pa;
//  if(menuChildren.is(':not(:hidden)')&& clickedItemSiblings.is(':hidden')) {
//   menuChildren.hide(/*animateToPosition*/);
// }

setTimeout(function(){clickedItemSiblings.toggle(hideSpeed)}, hideSpeed);
 hideSpeed=500;
//
// for (var i = count-1; i >= 0; i--) {
//     val = vals[i];
//     var searchBranch= "#thumbBox_"+$(val).attr("id").split("_")[1]
//     if($(searchBranch).attr("id")!=$(branchClicked).attr("id")){
//     //  console.log($(val).attr("id"),$(branchClicked).attr("id"))
//     //  possibility one: make the subpages disapear before hidden
//     if ($(val).children.length > 0 && $(val).parent.length > 0) {
//       valChildren = $(val).find(".thumbBox");
//       if (jsonEqual(evt.currentTarget, $(val).parent) && !valChildren.is(':hidden')) {
//         valChildren.hide();
//       }
//     }
//   }
// }
})
  // Set positions of thumbnails
  animateThumbPositions(true);

  setPages();
  // Check completion
  updateCompletion();
  // refreshInterval = setInterval(function() {
  //   updateCompletion();
  // }, 1000);
  setContent("1");





// initChapterThumbnailsClick();
// initPageThumbnailClick();
  resizeWindow();
}


function clearSidebar() {
  $("#sidebar").empty();
}

function initChapter(ch) {
  var chapter = new Chapter(ch);
  state.chapters.push(chapter);
}

function Chapter(ch) {

  // var chapter = {};
  // chapter.title = ch.title;
  // chapter.content=ch.content;
  // chapter.type=ch.type;
  // chapter.pages = [];
  // for (var i = 0; i < ch.pages.length; i++) {
  //   var page = new Page(ch.pages[i]);
  //   chapter.pages.push(page);
  // }
   // chapter.expanded = false;
   ch.expanded = false;
  return ch;
}

function Page(pg) {
  var page = {};
  page.type = pg.type;
  page.title = pg.title;
  page.content = pg.content;
  page.overlays = pg.overlays;
  page.key = pg.key;
  return page;
}


function makeThumbnail(pg, treeInfo) {


var pageTypes= ["chapter","page","subpage"]
var treeInfoString=treeInfo.join("_");
var [chapterID,pageID,subpageID]=treeInfo;
var thumbClass=pageTypes[treeInfo.length-1]
var chapterIndex =treeInfo[0];
var navSelector="#sidebar"
if (treeInfo.length!=1){
  navSelector ="#thumbBox_"+treeInfo.slice(0,-1).join("_")
}
state.lookup[treeInfoString]=pg;

//gives pages no 'chapter numbers'
if (treeInfo.length > 1) {
  chapterIndex = "";
}
 state.chapterList.push(treeInfoString)

  var thumbBox= $('<div/>',{id:"thumbBox_" +treeInfoString, class:"thumbBox "+thumbClass+"Box"})
  var thumb =$('<div/>',{id:"thumb_" + treeInfoString, class:"thumb "+thumbClass+"Thumb"})
  var thumbText =$('<div/>',{id:"thumbText_" + treeInfoString,text:pg.title, class:"thumbText"})

  var thumbNumber =$('<div/>',{id:"thumbNumber_" + treeInfoString, text:chapterIndex, class:"thumbNumber"})
  var thumbGlow= $('<div/>',{id:"thumbGlow_" + treeInfoString, class:"thumbGlow"})
  $(navSelector).append(thumbBox.append(thumb.append([thumbText,thumbNumber, thumbGlow])))

  // Bind event listener
  if (pageID=="chapter"){
  //initChapterThumbnailClick(chapterID);
}
else {
//initPageThumbnailClick(i, j)

}
}

// function makePageThumbnail(pg, chapterID, pageID) {
//   // Create divs
//   $("#sidebar").append('<div id="thumbBox' + chapterID + '-' + pageID + '" class="thumbBox pageBox"></div>');
//   $("#thumbBox" + chapterID + "-" + pageID).append('<div id="thumb' + chapterID + '-' + pageID + '" class="thumb pageThumb"></div>');
//   $("#thumbBox" + chapterID + "-" + pageID).append('<div id="thumbGlow' + chapterID + '-' + pageID + '" class="thumbGlow"></div>');
//   $("#thumb" + chapterID + "-" + pageID).append('<div id="thumbText' + chapterID + '-' + pageID + '" class="thumbText"></div>');
//   $("#thumb" + chapterID + "-" + pageID).append('<div id="thumbType' + chapterID + '-' + pageID + '" class="thumbType"></div>');
//   $("#thumb" + chapterID + "-" + pageID).append('<div id="thumbTypeText' + chapterID + '-' + pageID + '" class="thumbTypeText"></div>');
//   // Set title text
//   $("#thumbText" + chapterID + "-" + pageID).text(pg.title);
//   // Set type text
//
//   $("#thumbTypeText" + chapterID + "-" + pageID).text(pg.type.toUpperCase());
//
//
//   // Bind event listener
//   initPageThumbnailClick(chapterID, pageID);
// }


function initChapterThumbnailsClick() {

 for (var x = 0; x < state.chapters.length; x++) {
  state.chapters[x].expanded = false;
 }
  //animateThumbPositions(state.chapters, false);

$('.thumbBox,.thumbGlow').each(function(item, val){})

  // $(".pageBox").css("visibility", "hidden");
  // $(".chapterThumb").on("click", function(evt) {
  //
  //   var i = evt.currentTarget.id.split("_")[1];
  //   console.log(i)
  //   var wasExpanded = false
  //   for (var x = 0; x < state.chapters.length; x++) {
  //     if (state.chapters[x].expanded == true) {
  //       state.chapters[x].expanded = false;
  //       for (var j = 1; j < state.chapters[x].pages.length + 1; j++) {
  //         if ($("#thumbBox_" + x + "_" + j).css("visibility") == "hidden") {
  //           $("#thumbBox_" + x + "_" + j).css("visibility", "visible");
  //           $("#thumbGlow_" + x + "_" + j).css("left", "11%");
  //         } else {
  //           $("#thumbBox_" + x + "_" + j).css("visibility", "hidden");
  //           $("#thumbGlow_" + x + "_" + j).css("left", "6%");
  //         }
  //       }
  //       animateThumbPositions(state.chapters, false);
  //       if (i == x) {wasExpanded = true}
  //     }
  //   //}
  //   console.log(state.chapters[i].expanded)
  //   if (wasExpanded == false) {
  //     if (state.chapters[i].expanded == false) {
  //       state.chapters[i].expanded = true;
  //       for (var j = 1; j < state.chapters[i].pages.length + 1; j++) {
  //         if ($("#thumbBox_" + i + "_" + j).css("visibility") == "hidden") {
  //           $("#thumbBox_" + i + "_" + j).css("visibility", "visible");
  //           $("#thumbGlow_" + i + "_" + j).css("left", "11%");
  //         } else {
  //           $("#thumbBox_" + i + "_" + j).css("visibility", "hidden");
  //           $("#thumbGlow_" + i + "_" + j).css("left", "6%");
  //         }
  //       }
  //       animateThumbPositions(state.chapters, false);
  //     }
  //   }
  //   else {wasExpanded = false}
  //   currentPage.chapterID = i;
  //   currentPage.quizID = 0;
  //   var pageInfo={type:state.chapters[i].type,title:state.chapters[i].title,content:state.chapters[i].content}
  //   console.log(pageInfo)
  //   setContent(pageInfo , i, 0);
  //   $("#thumb_" + i + "_" + 0).attr("clicked", true)
  //   updateCompletion();
  // });
}


function initPageThumbnailClick() {

}

function animateThumbPositions(isInstant) {
  // var thumbCount = -1;
  // var delay = 250;
  // if (isInstant) {
  //   delay = 0;
  // }
  // for (var i = 0; i < state.chapters.length; i++) {
  //   thumbCount++;
  //   animateToPosition($("#thumbBox_" + i), thumbCount, delay);
  //   for (var j = 0; j < state.chapters[i].pages.length; j++) {
  //     if (state.chapters[i].expanded) {
  //       thumbCount++;
  //     }
  //
  //     animateToPosition($("#thumbBox_" + i + "_" + (j+1)), thumbCount, delay);
  //   }
  // }
}

function animateToPosition(div, position, duration) {
  // div.animate({
  //   "top": (12.5 * position) + "%"
  // }, duration);
}



// Set content in the center of the page to
function setContent(stem) {
if($("#contentLoader").data("stem")==stem){return}

  $("#contentLoader").data("stem",stem)
  var pg=state.lookup[stem];
  var content = pg.content;
  console.log(pg)
  if (pg.type == "text") {
    // TODO: display text
    $("#contentLoader").html('<div id="contentText" style="width: 100%; height: 100%;" ALLOWTRANSPARENCY="true"></div>');
    $("#contentText").html(pg.content);
  } else {
    // Display an iframe containing the specified video quiz
    $("#contentLoader").html('<iframe id="contentFrame" style="width: 100%; height: 100%;" ALLOWTRANSPARENCY="true"></iframe>');
    if (pg.content) {
      var contentSource=pg.content + "?testing=" + testing + "&key=" + pg.type + "_" +stem+ "&local=" + module.localStorageKey;
      if (pg.type=="cover"){
        contentSource=pg.content+"title="+pg.title;
      }
      $("#contentFrame").attr("src",contentSource);
      if (pg.type.toLowerCase() == "vq") {
        $('#contentFrame').on("load", function() {
          $('#contentFrame')
            .contents().find("head")
            .append($('<script>$("#scoreBox").css("display","none"); $("#noQuestionText").css("display","none");            </script>'));
        });
      }
    }
  }
  var sectionArr = stem.split("_");
  if (sectionArr.constructor === Array) {
    var sectionStr = "" + sectionArr[0];
    for (i = 1; i < sectionArr.length; i++) {
      sectionStr = sectionStr + "-" + sectionArr[i];
    }
  }
  $('#pageNumberText').text(sectionStr);
  // if (showingOverlay) {
  //   showOverlay(false);
  // }
  // $(".overlayButton").removeClass("caliperButton");
  // $(".overlayButton").removeClass("btn");
  // $(".overlayButton").removeClass("hidden");
  // $("#overlayMenu").addClass("hidden");
  // $("#overlay").empty();
  // $("#overlayMenuOptions").html("");
  // canShowOverlay = false;
  // if (pg.overlays != null && pg.overlays != undefined) {
  //   if (pg.overlays.length > 0) {
  //     $("#overlayButton1").addClass("btn");
  //
  //     if (pg.overlays.length == 1) {
  //       var overlay = pg.overlays[0];
  //       if (overlay == "calipers") {
  //         $("#overlayButton1").addClass("caliperButton");
  //       }
  //       $("#overlay").append('<iframe id="overlayFrame" ALLOWTRANSPARENCY="true"></iframe>');
  //       $("#overlayFrame").attr("src", module.overlayURLs[overlay]);
  //       canShowOverlay = true;
  //
  //       $("#overlayButton1").click(function() {
  //         if (canShowOverlay) {
  //           if (!showingOverlay) {
  //             showOverlay(true);
  //           } else {
  //             showOverlay(false);
  //           }
  //         }
  //         resizeWindow();
  //       });
  //
  //     } else {
  //       for (var i = 0; i < pg.overlays.length; i++) {
  //         linkOverlay(pg.overlays[i]);
  //       }
  //       $("#overlayButton1").off("click");
  //       $("#overlayButton1").on("click",
  //         function() {
  //           if ($("#overlayMenu").hasClass("hidden")) {
  //             $("#overlayMenu").removeClass("hidden");
  //           } else {
  //             $("#overlayMenu").addClass("hidden");
  //           }
  //         }
  //       );
  //       canShowOverlay = true;
  //     }
  //
  //   }
  // } else {
  //   $(".overlayButton").addClass("hidden");
  // }
  // $(".thumbGlow").css("visibility", "hidden");
  // // $("#thumbGlow" + chapterID + "-" + pageID).css("visibility", "visible");
  // // $("#pageNumberText").text((chapterID + 1) + "-" + (pageID + 1));
  // resizeWindow();


}

function linkOverlay(overlay) {
  $("#overlay").append('<iframe class="' + overlay + ' overlay" ALLOWTRANSPARENCY="true"></iframe>');
  $("." + overlay).attr("src", module.overlayURLs[overlay]);
  var option = $("<a></a>");
  option.addClass('overlayMenuItem');
  option.attr('id', overlay);
  option.html(overlay);

  option.on("click", function() {
    if ($("." + overlay).hasClass("anim_overlayOff")) {

      $(".overlay").each(function() {
        $(this).removeClass("anim_overlayOn");
        $(this).addClass("anim_overlayOff");
      })

      $("." + overlay).removeClass("anim_overlayOff");
      $("." + overlay).addClass("anim_overlayOn");
      resizeWindow();
    } else {

      $(".overlay").each(function() {
        $(this).removeClass("anim_overlayOn");
        $(this).addClass("anim_overlayOff");
      })

      $("." + overlay).removeClass("anim_overlayOn");
      $("." + overlay).addClass("anim_overlayOff");
      resizeWindow();
    }
  })
  $("#overlayMenuOptions").append(option);
}

function nextPage(offset) {
  var moved = false;
  while (offset != 0) {
    if (offset > 0) {
      if (currentPage.quizID < state.chapters[currentPage.chapterID].pages.length) {
        currentPage.quizID++;
        console.log(currentPage.quizID)
        console.log(currentPage.chapterID)
        moved = true;
      } else {
        if (currentPage.chapterID < state.chapters.length - 1) {
          currentPage.chapterID++;
          currentPage.quizID = 0;
          moved = true;
        }
      }
      offset--;

    } else if (offset < 0) {
      if (currentPage.quizID > 0) {
        currentPage.quizID--;
        moved = true;
      } else {
        if (currentPage.chapterID > 0) {
          currentPage.chapterID--;
          currentPage.quizID = state.chapters[currentPage.chapterID].pages.length - 1;
          moved = true;
        }
      }
      offset++;
    }
  }
  console.log(moved);
  if (moved) {
    //#####################################
    var i = currentPage.chapterID + 1;
    var j = currentPage.quizID;
    stem = i + "";
    if (j > 0) {
      stem = i + "_" + j;
    }
    setContent(stem);
    $("#thumb_" + i + "_" + (j+1)).attr("clicked", true)
    updateCompletion();
    //#####################################
    if (j == 0) {
      for (var x = 0; x < state.chapters.length; x++) {
        if (state.chapters[x].expanded == true && i != x) {
          state.chapters[x].expanded = !state.chapters[x].expanded;
          for (var j = 1; j < state.chapters[x].pages.length+1; j++) {
            if ($("#thumbBox" + x + "_" + j).css("visibility") == "hidden") {
              $("#thumbBox" + x + "_" + j).css("visibility", "visible");
              $("#thumbGlow" + x + "_" + j).css("left", "11%");
            } else {
              $("#thumbBox" + x + "_" + j).css("visibility", "hidden");
              $("#thumbGlow" + x + "_" + j).css("left", "6%");
            }
          }
          animateThumbPositions(false);
        }
      }

      if (state.chapters[i].expanded == false) {
        state.chapters[i].expanded = !state.chapters[i].expanded;
        for (var j = 1; j < state.chapters[i].pages.length+1; j++) {
          if ($("#thumbBox" + i + "_" + j).css("visibility") == "hidden") {
            $("#thumbBox" + i + "_" + j).css("visibility", "visible");
            $("#thumbGlow" + i + "_" + j).css("left", "11%");
          } else {
            $("#thumbBox" + i + "_" + j).css("visibility", "hidden");
            $("#thumbGlow" + i + "_" + j).css("left", "6%");
          }
        }
        animateThumbPositions(false);
      }
    }
    //#####################################
  }
}

function showGrades() {
  var htAccess = true;
  if (htAccess) {
    $.ajax({
      url: "sourceFiles/api/getUser"
    }).done(function(keydata) {
      $("#gradesOverlayContent").html("Grading<br><strong style='color:#FF3B3F'>Loading</strong><br>Please Wait!");
      var studentInfo = organizeKey(keydata);

      grading(studentInfo);


      $("#gradesOverlay").toggleClass("hidden");
      $("#gradesOverlayTransparent").toggleClass("hidden");
      $("#gradesOverlayHeader").html("<u>" + studentInfo[0] + "'s Grades</u>");
    });
  } else {
    $("#gradesOverlay").toggleClass("hidden");
    $("#gradesOverlayTransparent").toggleClass("hidden");
    $("#gradesOverlayContent").html("Grading Was<br><strong style='color:#FF3B3F'>Not Enabled</strong><br>For This Class");
  }
}

function grading(studentInfo) {
  $("#gradesOverlayContent").html("<div id='vqGrading' class='hidden'></div><div id='quizGrading' class='hidden'></div>");
  $("#gradesOverlayContent").append("<div id='gradingSelection' class=''><div id='VQgradingTitleSection' class='gradingTitleSection'>VQ Grades</div><div id='QUIZgradingTitleSection' class='gradingTitleSection'>Quiz Grades</div></div>");

  $("#QUIZgradingTitleSection").click(function(){
    $("#vqGrading").removeClass("hidden");
    $("#quizGrading").removeClass("hidden");
    $("#vqGrading").addClass("hidden");
  });

  $("#VQgradingTitleSection").click(function(){
    $("#vqGrading").removeClass("hidden");
    $("#quizGrading").removeClass("hidden");
    $("#quizGrading").addClass("hidden");
  });

  for (var x = 0; x < state.chapters.length; x++) {
    var currentChapter = state.chapters[x];
    for (var y = 0; y < currentChapter.pages.length; y++) {
      var currentPage = currentChapter.pages[y];
      if (currentPage.type.toLowerCase() == "vq") {
        createVQGrade(currentPage, studentInfo);
      } else if (currentPage.type.toLowerCase() == "quiz") {
        createQUIZGrade(currentPage, studentInfo, x, y);
      }
    }
  }
}

function showDemQuizGrades(fullgrades) {
  var gradeTitle = "<div class='gradeTitleItem'><u>" + fullgrades.page + "</u></div>";
  var gradeGrades = "<div class='gradeGradesItem'>" + fullgrades.grade + "</div>";
  var grade = "<div class='gradeItem '>" + gradeTitle + gradeGrades + "</div>";
  $("#quizGrading").append(grade);
}

function showDemVQGrades(fullgrades) {
    var gradeTitle = "<div class='gradeTitleItem'><u>" + fullgrades.page + "</u></div>";
    var gradeGrades = "<div class='gradeGradesItem'>" + fullgrades.grade + "</div>";
    var grade = "<div class='gradeItem '>" + gradeTitle + gradeGrades + "</div>";
    $("#vqGrading").append(grade);
}

function createVQGrade(currentPage, studentInfo) {
  var grade = {};
  grade.page = currentPage.title;

  var linkSplit = currentPage.content.split("/");
  $.ajax({
    url: "sourceFiles/api/getVQGrade/" + linkSplit[3] + "/" + linkSplit[4] + "/" + studentInfo[2]
  }).done(function(keydata) {
    var calcgrade = keydata.split("/");
    if (calcgrade[1] != 0) {
      grade.grade = ((calcgrade[0] / calcgrade[1]) * 100.00).toFixed(2);
      console.log(grade.grade);
    } else {
      grade.grade = 100;
    }
    showDemVQGrades(grade);
  });
}

function createQUIZGrade(currentPage, studentInfo, x, y) {
  var grade = {};
  grade.page = currentPage.title;

  if (progress.getKey(currentPage.type + "_" + x + "_" + y) == "done") {
    grade.grade = 100;
  } else {
    grade.grade = 0;
  }

  showDemQuizGrades(grade);
}

function organizeKey(keydata) {
  var data = keydata.split(",");

  for (var i = 0; i < data.length; i++) {
    var segment = data[i];

    segment = segment.split('"').join('');
    segment = segment.split('}').join('');
    var index = segment.indexOf(':');

    data[i] = segment.slice(index + 1, segment.length);
  }

  return data;
}

// Update completion
function updateCompletion() {

  $(".thumbType").removeClass("page_incomplete");
  $(".thumbType").removeClass("page_complete");

  if (debug) {
    console.log('\n' + "----------Update Completion----------");
  }
  for (var i = 0; i < state.chapters.length; i++) {

    var completedPages = 0;
    var chapterSelected = state.chapters[i];
    var chapterEl = $("#thumbType" + i);

    completedPages = updatePages(i, completedPages);

    if (completedPages == chapterSelected.pages.length) {
      chapterEl.addClass("chapter_complete")
    } else {
      chapterEl.addClass("chapter_incomplete")
    }
  }
  if (debug) {
    console.log("----------End Update Completion----------" + '\n');
  }
}

function updatePages(i, completedPages) {
// thumb type no longer exists. code must be edited to show complete
  for (var j = 0; j < state.chapters[i].pages.length; j++) {

    var complete = false;
    var pg = state.chapters[i].pages[j];
    var thumbEl = $("#thumbType" + i + "-" + j)
    var key = progress.getKey(pg.type + "_" + i + "_" + j);

    if (debug) {
      console.log(key, pg.type, i, j, $("#thumb" + i + "-" + j).attr("clicked"))
    }
    if (pg.type == "text" && $("#thumb" + i + "-" + j).attr("clicked")) {

      thumbEl.addClass("page_complete");
      completedPages++;

    } else if (pg.type == "cover" && $("#thumb" + i + "-" + j).attr("clicked")) {

      thumbEl.addClass("page_complete");
      completedPages++;

    } else if (pg.type == "vq") {

      // Check local storage
      var quizCompletion = JSON.parse(localStorage.getItem(pg.content));
      var complete = false;

      if (quizCompletion != null) {
        complete = true;
        for (var k = 0; k < quizCompletion.length; k++) {
          if (quizCompletion[k] == false) {
            complete = false;
          }
        }
      }
    } else if (progress.getKey(pg.type + "_" + i + "_" + j)) {
      thumbEl.addClass("page_complete");
      completedPages++;
    } else {
      thumbEl.addClass("page_incomplete");
    }
  }

  return completedPages;

}

function showOverlay(bool) {
  showingOverlay = bool;
  if (showingOverlay) {
    $("#overlay").removeClass("anim_overlayOff");
    $("#overlay").addClass("anim_overlayOn");
  } else {
    $("#overlay").removeClass("anim_overlayOn");
    $("#overlay").addClass("anim_overlayOff");
  }
}

function setPages() {
  for (var i = 0; i < state.chapters.length; i++) {
    for (var j = 0; j < state.chapters[i].pages.length; j++) {
      $("#thumbBox" + i + "-" + j).css("visibility", "hidden");
    }
  }
}
