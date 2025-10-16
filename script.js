const apiUrl = "https://nps-backend.bcrcx.com/custom-objects";
const subdomain = window.HelpCenter.account.subdomain;
const currentBrandId = window.location.href
  .split("brand_id=")[1]
  ?.split("&")[0];
const isCsat = window.location.href.split("isCsat=")[1]?.split("&")[0];
const ticketId = window.location.href.split("ticketID=")[1];
var assetsRightArrow = "{{asset 'right-arrow.png'}}";

const yesCheck = (clickedEl) => {
  const container = clickedEl.closest(".yesOrNot-container");
  if (!container) return;

  const yesBtn = container.querySelector(".answer-box.yes");
  const notBtn = container.querySelector(".answer-box.not");

  yesBtn.classList.add("selected");
  notBtn.classList.remove("selected");
};

const notCheck = (clickedEl) => {
  const container = clickedEl.closest(".yesOrNot-container");
  if (!container) return;

  const yesBtn = container.querySelector(".answer-box.yes");
  const notBtn = container.querySelector(".answer-box.not");

  notBtn.classList.add("selected");
  yesBtn.classList.remove("selected");
};

(() => {
  //data verification
  const isViewPage = window.location.href.includes("&view");

  if (!isViewPage && (!ticketId || !currentBrandId || !isCsat)) {
    document.querySelector(".loader-container").style.display = "none";
    document.querySelector(".not-found-container").style.display = "flex";
    return;
  }

  let questionsResponse = [];

  const setLoading = (isLoading) => {
    const loadingContainer = document.querySelector(".loader-container ");
    loadingContainer.style.display = isLoading ? "flex" : "none";

    const form = document.querySelector(".csat-form");

    if (form) {
      form.style.display = isLoading ? "none" : "block";
    }
  };

  const handleComment = (has_comment) => {
    return has_comment
      ? `<textarea class="comment" placeholder="..."></textarea>`
      : "";
  };

  const handleClickIcon = () => {
    const iconsContainers = document.querySelectorAll(".icons-container");

    iconsContainers.forEach((container) => {
      const icons = Array.from(container.children);

      icons.forEach((icon, index) => {
        icon.addEventListener("click", () => {
          icons.forEach((el, idx) => {
            if (idx <= index) {
              el.classList.add("selected");
            } else {
              el.classList.remove("selected");
            }
          });
        });
      });
    });
  };

  const syncRangesWidth = () => {
    const iconsContainers = document.querySelectorAll(".icons-container");

    iconsContainers.forEach((iconsContainer) => {
      const range = iconsContainer.nextElementSibling;
      if (range && range.classList.contains("range")) {
        const width = iconsContainer.offsetWidth;
        range.style.width = width + "px";
      }
    });
  };

  const gradientColors = [
    "#ff0000",
    "#ff8000",
    "#ffff00",
    "#80ff00",
    "#00ff00",
  ];

  const getGradientColor = (factor) => {
    const segmentCount = gradientColors.length - 1;
    const segment = Math.min(
      Math.floor(factor * segmentCount),
      segmentCount - 1
    );
    const localFactor = factor * segmentCount - segment;

    return lerpColor(
      gradientColors[segment],
      gradientColors[segment + 1],
      localFactor
    );
  };

  const lerpColor = (color1, color2, factor) => {
    const hex = (color) => color.match(/\w\w/g).map((x) => parseInt(x, 16));
    const [r1, g1, b1] = hex(color1);
    const [r2, g2, b2] = hex(color2);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleBox = () => {
    const iconsContainers = document.querySelectorAll(".icons-container");

    iconsContainers.forEach((container) => {
      const boxes = container.querySelectorAll(".box");
      const steps = boxes.length;

      boxes.forEach((box, index) => {
        box.innerHTML = isCsat === "true" ? index + 1 : index;

        box.style.backgroundColor = "white";
        box.style.border = "1px solid black";
        box.style.color = "black";
        box.style.width = "50px";
        box.style.height = "50px";

        box.addEventListener("click", () => {
          boxes.forEach((el, idx) => {
            if (idx <= index) {
              const factor = idx / (steps - 1);
              const bgColor = getGradientColor(factor);

              el.style.backgroundColor = bgColor;
              el.style.color = "white";
              el.style.border = "none";
            } else {
              el.style.backgroundColor = "white";
              el.style.color = "black";
              el.style.border = "2px solid black";
            }
          });
        });
      });
    });
  };

  const handleIcons = (iconType) => {
    const quantity = isCsat === "true" ? 5 : 11;

    const assets = document.getElementById("assets");
    const emojiList = [
      assets.dataset.sad,
      assets.dataset.confused,
      assets.dataset.smile,
      assets.dataset.happy,
      assets.dataset.veryHappy,
    ];
    const assetsStarDefault = assets.dataset.star;
    const assetsHeartIcon = assets.dataset.heart;

    let icons = [];

    if (iconType === "emoji") {
      const iconsToUse = isCsat ? emojiList.slice(0, 5) : emojiList;
      icons = iconsToUse.map((src, index) => `<img key=${index} src=${src} />`);
    } else if (iconType === "box") {
      icons = Array.from({ length: quantity }, (_, index) => {
        return `<div key=${index} class="box" id='box-${index + 1}'></div>`;
      });
    } else {
      const src = iconType === "star" ? assetsStarDefault : assetsHeartIcon;
      icons = Array.from({ length: quantity }, (_, index) => {
        return `<img key=${index} src=${src} />`;
      });
    }

    return icons;
  };

  const returnQuestions = async (templateId) => {
    setLoading(true);
    const response = await fetch(
      `${apiUrl}/${subdomain}/${templateId}/questions`
    );
    const data = await response.json();
    const reversedQuestions = data.data.reverse();
    questionsResponse = Array.from(
      { length: reversedQuestions.length },
      () => 0
    );
    setLoading(false);
    return reversedQuestions;
  };

  const listTemplates = async () => {
    const assets = document.getElementById("assets");
    const response = await fetch(
      `${apiUrl}/${subdomain}/${currentBrandId}/template`,
      {
        method: "GET",
      }
    );

    let data;

    if (response.status === 200) {
      data = await response.json();
      var template = data.data.filter((item) => {
        return item.is_csat.toString() === isCsat;
      });
      setLoading(false);
    } else {
      setLoading(false);
      alert("Falha ao carregar formulário");
    }

    const questions = await returnQuestions(template[0].id);
    const questionList = questions.map((question) => {
      const icons = handleIcons(template[0].icon);
      const iconsHtml = icons.join("");

      const yesOrNotQuestion = `
      <h3>${question.question}</h3>
      <div class="yesOrNot-container question-container">
        <div class="answer-box yes" onClick="yesCheck(this)"><img src="${assets.dataset.check}" /></div>
        <div class="answer-box not"  onClick="notCheck(this)"><img src="${assets.dataset.cross}" /></div>
      </div>
    `;

      const iconsQuestion = `
      <h3>${question.question}</h3>
      <div class="icons-container question-container">${iconsHtml}</div>
      <div class="range">
        <p>Insatisfeito</p>
        <p>Satisfeito</p>
      </div>
    `;

      return question.type === "default" ? iconsQuestion : yesOrNotQuestion;
    });

    const form = `
    <form class="csat-form">
      ${questionList}
      ${handleComment(template[0].has_comment)}
      <button class="send-button">
        <img src="${assets.dataset.arrow}" />
      </button>
    </form>
  `;

    document.querySelector(".container").insertAdjacentHTML("afterbegin", form);
    handleClickIcon();
    handleBox();
    syncRangesWidth();

    document?.querySelector(".send-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      handleSubmit();
    });
  };

  listTemplates();

  //resend function
  document.querySelector(".resend-btn").addEventListener("click", () => {
    document.querySelector(".like-modal").style.display = "none";
    document.querySelector(".csat-form").style.display = "flex";
  });

  const handleSubmit = async () => {
    setLoading(true);
    const questions = document.querySelectorAll(".question-container");
    questions.forEach((question, index) => {
      if (question.classList.contains("icons-container")) {
        const selected = question.querySelectorAll(".selected");

        if (selected.length === 0) {
          questionsResponse[index] = null;
        } else if (isCsat === "true") {
          questionsResponse[index] = selected.length;
        } else {
          const lastSelected = [...selected].pop();
          const allBoxes = question.querySelectorAll(".box, img");
          const selectedIndex = [...allBoxes].indexOf(lastSelected);
          questionsResponse[index] = selectedIndex;
        }
      } else if (question.classList.contains("yesOrNot-container")) {
        const answerBox = question.querySelectorAll(".answer-box");
        if (answerBox[0].classList.contains("selected")) {
          questionsResponse[index] = true;
        } else {
          questionsResponse[index] = false;
        }
      }
    });

    if (questionsResponse.includes(0)) {
      alert("Favor responder todas as perguntas.");
      return;
    }

    const commentValue = document.querySelector(".comment")?.value;
    const brandIdFormatted = currentBrandId.includes("%20")
      ? currentBrandId.replace(/%20/g, " ")
      : currentBrandId;

    const payload = {
      average_rating: questionsResponse,
      brand_id: brandIdFormatted,
      comment: commentValue ?? "-",
      ticket_id: ticketId,
      type: isCsat === "true" ? "CSAT" : "NPS",
    };

    const response = await fetch(`${apiUrl}/${subdomain}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setLoading(false);
      document.querySelector(".like-modal").style.display = "flex";
      document.querySelector(".csat-form").style.display = "none";
    } else {
      setLoading(false);
      alert("Erro inesperado. Favor tente novamente mais tarde.");
    }
  };
})();
