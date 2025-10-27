// const JSON_HEAD = {"Content-Type": "applicarion/json"}

async function refreshToken() {
  try {
    const refresh_token = localStorage.getItem("___refresh_token");
    if (!refresh_token) throw new Error("No refresh token found");

    const response = await fetch(`${MAIN_SERVER}/refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ___refresh_token: refresh_token })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to refresh token");

    // Save new tokens to localStorage
    localStorage.setItem("___access_token", data.___access_token);
    if (data.___refresh_token) localStorage.setItem("___refresh_token", data.___refresh_token);

    return data.___access_token;
  } catch (err) {
    console.log("Token refresh failed:", err);
    return null;
  }
};
function initAddStory() {
  let storyState = false;
  let storyInput = document.querySelectorAll(".mainStory .storyInput");
  let storyTrigger = document.querySelectorAll(".storyTrigger");
  let captionBtn = document.querySelector(".captionBtn");
  let captionInput = document.querySelector(".captionInput");

  storyTrigger.forEach(trigger => {
    trigger.addEventListener("click", () => { storyState = true });
  });

  storyInput.forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file || storyState === false) return;

      getPop(".caption");

      captionBtn.onclick = async () => {
        captionBtn.classList.add("load");

        const now = new Date();
        const timestamp = now.getFullYear() + "-" +
                          String(now.getMonth() + 1).padStart(2, "0") + "-" +
                          String(now.getDate()).padStart(2, "0") + "T" +
                          String(now.getHours()).padStart(2, "0") + ":" +
                          String(now.getMinutes()).padStart(2, "0") + "_" +
                          String(now.getSeconds()).padStart(2, "0");

        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileExt = file.type.split("/")[1];
        const fileName = `${timestamp.replace(":", "")}_${randomSuffix}.${fileExt}`;

        const formData = new FormData();
        formData.append("file", file, fileName);

        fetch(`${MAIN_SERVER}/upload`, {
          method: "POST",
          credentials: "include",
          body: formData
        })
        .then(rsp => {
          if (rsp.status === 200) {
            fetch(`${MAIN_SERVER}/post_story`, {
              method: "POST",
              credentials: "include",
              headers: JSON_HEAD,
              body: JSON.stringify({
                "id": localStorage.getItem("sokoni_identity"),
                "data": {
                  "story_url": `${MAIN_SERVER}/skn_uploads/${fileName}`,
                  "post_date": timestamp.split("_")[0],
                  "caption": captionInput.value
                }
              })
            })
            .then(async rsp => {
              if (rsp.status === 200) {
                captionInput.value = "";
                setTimeout(async () => {
                  let js_dt = await rsp.json();
                  console.log(js_dt);
                  captionBtn.classList.remove("load");
                  shutPop(".caption");
                  initGetStories();
                }, 1000);
              }
            });
          }
        });
      };
    });
  });

  window.addEventListener("popstate", () => { storyState = false });
};
function renderStories(data) {
  const container = document.querySelector('.profileRecommend');
  container.innerHTML = ''; // clear existing content

  // get viewed stories from localStorage
  const viewedStories = JSON.parse(localStorage.getItem('sokoni_viewed_stories') || '[]');

  data.forEach(user => {
    const uName = user.user_id; // or replace with username if available
    const hasUnviewedStory = user.story_list.some(
      story => !viewedStories.includes(story.story_url)
    );

    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profileData');
    if (hasUnviewedStory) profileDiv.classList.add('story');
    profileDiv.setAttribute('uName', uName);

    const img = document.createElement('img');
    img.src = user.profile_pic || 'assets/images/faces/default.jfif';
    profileDiv.appendChild(img);

    container.appendChild(profileDiv);
  });
};
async function initGetStories() {
  fetchStories()
  .then(dt => {
    
  })
};
async function loadPosts() {
  const postList = get('.postList.mainFeedPosts');
  postList.innerHTML = '<img src="assets/images/loader.gif" class="loaderGif">';

  try {
    const postsRes = await fetch(`${MAIN_SERVER}/get_products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const posts = await postsRes.json();
    shuffleArray(posts);
    postList.innerHTML = '';

    for (const post of posts) {
      const data = post.data || {};
      const userPic = post.host_profile_pic || 'assets/images/faces/user1.jfif';
      const userName = post.host_username || 'anonymous';
      const badge = post.host_verification || 'null';
      const imageUrl = data.images?.[0] || 'assets/images/products/iphone0.jfif';

      let hashtags = extractHashtags(data.description || '');
      const postCont = document.createElement('div');
      postCont.className = 'postCont';
      postCont.innerHTML = `
        <div class="post" style="background-image: url(${imageUrl});">
          <div class="postClick"></div>
          <div class="postHead">
            <div class="leftData">
              <img onclick="getFloater('.profileView')" src="${userPic}" alt="" class="profilePic acti">
              <div class="userData">
                <h4>${userName} <img src="assets/images/badges/${badge}.png"></h4>
                <div class="group">
                  <p><i class="fi fi-sr-marker"></i> Dodoma, Tanzania</p>
                  <p><i class="fi fi-sr-calendar"></i> ${formatDate(post.created_at)}</p>
                </div>
              </div>
            </div>
            <i class="fi fi-rr-menu-dots-vertical popAct" onclick="getPop('.optionsReport')"></i>
          </div>
          <h2 class="postPrice" old="Tsh. ${formatShort(data.price * 1.2)}">Tsh. ${formatMoney(data.price)}/-</h2>
          <div class="postActions">
            <i class="fi fi-sr-heart"></i>
            <!-- <i class="fi fi-rr-comment-alt-middle" onclick="getPop('.comments')"></i> -->
            <i class="fi fi-rr-bookmark"></i>
            <i class="fi fi-sr-star rating">0.0</i>
          </div>
        </div>
        <div class="postDetails">
          <div class="postTags">${hashtags}</div>
          <h4 onclick="getFloater('.productView')">${data.title}</h4>
          <p onclick="getPop('.description')"><b>@${userName}</b> 
            <span>${(data.description || '').length > 100 ? data.description.substring(0, 100) + '...' : data.description}</span> 
            <b>more</b>
          </p>
        </div>
        <h1 class="postAd" style="display:none;">Sponsored</h1>
      `;

      // Click to view product
      let postClick = postCont.querySelector(".postClick");
      postClick.onclick = () => {
        const postView = get('.postView');
        const add2CartBtn = postView.querySelector('.buyRightNow');
        const allSpecs = postView.querySelector('.specsList');

        postView.querySelector('.postDetails .remain b').textContent = formatMoney(data.stock);
        postView.querySelector('.profilePic').src = userPic;
        postView.querySelector('.userData h4').innerHTML = `${userName} <img src="assets/images/badges/${badge}.png">`;
        postView.querySelector('.group').innerHTML = `
          <p><i class="fi fi-sr-marker"></i> Dodoma, Tanzania</p>
          <p><i class="fi fi-sr-calendar"></i> ${formatDate(post.created_at)}</p>`;

        const imgScroll = postView.querySelector('.startup-scroll');
        const navScroll = postView.querySelector('.scroll-nav');
        imgScroll.innerHTML = '<div class="dummy"></div>';
        navScroll.innerHTML = '';

        data.images?.forEach((imgUrl, i) => {
          imgScroll.innerHTML += `<img src="${imgUrl}"/>`;
          navScroll.innerHTML += `<img class="nav ${i === 0 ? 'active' : ''}" src="${imgUrl}"/>`;
        });
        imgScroll.innerHTML += '<div class="dummy"></div>';

        postView.querySelector('.postDetails h1').innerText = data.title;
        postView.querySelector('.postTags').innerHTML = extractHashtags(data.description || '');
        postView.querySelector('.dsc').innerHTML = `<b>@${userName}</b> <span>${(data.description || '').replaceAll("\n", "<br>")}</span>`;

        postView.querySelector('.call2act h2').innerText = `Tzs. ${formatMoney(data.price)}/-`;
        postView.querySelector('.call2act h2').setAttribute('old', `Tsh. ${formatShort(data.price * 1.2)}`);

        allSpecs.innerHTML = '';
        if (Array.isArray(data.attributes)) {
          data.attributes.forEach((attr) => {
            const specItem = document.createElement('div');
            specItem.className = 'specItem';
            specItem.innerHTML = `
              <p>${attr.name}</p>
              <div class="selection">
                ${attr.values.map(v => `<p class="select"><i class="fi fi-sr-check-circle"></i> ${v}</p>`).join('')}
              </div>
            `;
            allSpecs.appendChild(specItem);

            // make one of them active by default
            const firstSelect = specItem.querySelector('.selection .select');
            if (firstSelect) firstSelect.classList.add('active');

            // add click behavior
            const selects = specItem.querySelectorAll('.select');
            selects.forEach(sel => {
              sel.addEventListener('click', () => {
                selects.forEach(s => s.classList.remove('active'));
                sel.classList.add('active');
              });
            });
          });
        }
        add2CartBtn.onclick = () => {
          // gather selected attributes
          add2CartBtn.classList.add('load');
          setTimeout(() => add2CartBtn.classList.remove('load'), 1000);
          const selectedAttributes = {};
          allSpecs.querySelectorAll('.specItem').forEach(spec => {
            const name = spec.querySelector('p').textContent.trim();
            const active = spec.querySelector('.select.active');
            if (active) selectedAttributes[name.toLowerCase()] = active.textContent.replace('check', '').trim();
          });

          const cartItem = {
            host: {
              id: post.host_id,
              username: userName,
              verification: badge,
              profile_pic: userPic,
              address: "Dodoma, Tanzania"
            },
            product: {
              id: post.id,
              title: data.title,
              price: data.price,
              thumbnail: data.images?.[0] || 'assets/images/products/iphone0.jfif',
              selected_attributes: selectedAttributes
            },
            amount: 1
          };

          // get current cart
          let cart = JSON.parse(localStorage.getItem('sokoni_cart')) || [];

          // check if already exists (same product + attributes)
          const exists = cart.find(item =>
            item.product.id === cartItem.product.id &&
            JSON.stringify(item.product.selected_attributes) === JSON.stringify(cartItem.product.selected_attributes)
          );

          if (exists) {
            exists.amount += 1; // increment if same item
          } else {
            cart.push(cartItem);
          }

          localStorage.setItem('sokoni_cart', JSON.stringify(cart));
          // console.log('Added to cart:', cartItem);
        };


        initStartupScroll();
        getFloater('.postView');
      };

      postList.appendChild(postCont);
    }
  } catch (err) {
    console.error('Error loading posts:', err);
    postList.innerHTML = '<p class="error">Failed to load posts.</p>';
  }
};
async function loadInventory(){
  const myInventory = document.querySelector('.myInventory .quickList');
  fetch(`${MAIN_SERVER}/get_inventory_products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ "id": localStorage.getItem("sokoni_identity") })
  })
  .then(rsp => rsp.json())
  .then(posts => {
    myInventory.innerHTML = '';
    posts.forEach(post => {
      const data = post.data || {};
      const imageUrl = data.images?.[0] || 'assets/images/products/iphone0.jfif';
      const postCont = document.createElement('div');
      postCont.className = 'miniPost';
      postCont.innerHTML = `
        <p class="price" old="Tsh. ${formatShort(data.price * 1.2)}">Tsh. ${formatMoney(data.price)}</p>
        <div class="call2act">
          <i class="fi fi-rr-copy"></i>
          <i class="fi fi-rr-edit"></i>
          <i class="fi fi-rr-trash"></i>
        </div>
      `;
      postCont.style.backgroundImage = `url(${imageUrl})`;
      myInventory.appendChild(postCont);
    });
  });
};
async function loadMyOrders() {
  const ordersList = document.querySelector('.myOrders .ordersCont');
  const searchInput = document.querySelector('.myOrders .searchInp input');

  const rsp = await fetch(`${MAIN_SERVER}/get_orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: localStorage.getItem("sokoni_identity") })
  });

  const orders = await rsp.json();
  console.log("My Orders:", orders);

  const renderOrders = (filter = '') => {
    ordersList.innerHTML = '';
    const q = (filter || '').toLowerCase();

    orders
      .filter(o => {
        // match by order id OR by host username
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const username = (o.host && o.host.username) ? o.host.username : '';
        const userMatch = username.toLowerCase().includes(q);
        return idMatch || userMatch;
      })
      .forEach(order => {
        const totalProducts = order.products.length;
        const status = order.delivered ? 'delivered' : order.ready ? 'ready' : 'pending';
        const host = order.host || {};
        const images = order.products
          .slice(0, 3)
          .map(p => `<img src="${p.thumbnail || 'assets/images/products/default.jpg'}" alt="">`)
          .join('');

        const productList = order.products.map(p => {
          const attrValues = Object.values(p.attributes || {}).join(', ');
          return `
            <div class="prd">
              <img src="${p.thumbnail || 'assets/images/products/default.jpg'}" alt="">
              <div class="data">
                <h4>${p.title || 'Untitled Product'}</h4>
                <p>${attrValues}</p>
              </div>
              <p class="total"><span>${p.amount}</span> Items</p>
            </div>
          `;
        }).join('');

        const el = document.createElement('div');
        el.className = 'order';
        el.innerHTML = `
          <div class="postHead">
            <div class="leftData">
              <img src="${host.profile_pic || 'assets/images/faces/user1.jfif'}" alt="" class="profilePic acti">
              <div class="userData">
                <h4>${host.username || 'unknown'} <img src="assets/images/badges/${host.verification || 'bronze'}.png"></h4>
                <div class="group">
                  <p><i class="fi fi-sr-marker"></i> Dar-es-salaam, Tanzania</p>
                  <p><i class="fi fi-sr-calendar"></i> ${new Date(order.created_at).toDateString()}</p>
                </div>
              </div>
            </div>
            <p class="el-status ${status}">${status}</p>
          </div>
          <div class="productsSummary">
            <div class="images">${images}</div>
            <p class="total"><span>${totalProducts}</span> Products</p>
          </div>
          <div class="productsList">${productList}</div>
        `;
        ordersList.appendChild(el);
      });
  };

  renderOrders();

  searchInput.addEventListener('input', e => {
    renderOrders(e.target.value);
  });
};
async function loadClientsOrders() {
  const ordersList = document.querySelector('.clientsOrders .ordersCont');
  const searchInput = document.querySelector('.clientsOrders .searchInp input');

  const rsp = await fetch(`${MAIN_SERVER}/get_client_orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: localStorage.getItem("sokoni_identity") })
  });

  const orders = await rsp.json();
  console.log("Clients Orders:", orders);

  const renderOrders = (filter = '') => {
    ordersList.innerHTML = '';
    const q = (filter || '').toLowerCase();

    orders
      .filter(o => {
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const username = (o.client && o.client.username) ? o.client.username : '';
        return idMatch || username.toLowerCase().includes(q);
      })
      .forEach(order => {
        const totalProducts = order.products.length;
        const status = order.delivered ? 'delivered' : order.ready ? 'ready' : 'pending';
        const client = order.client || {};
        const images = order.products
          .slice(0, 3)
          .map(p => `<img src="${p.thumbnail || 'assets/images/products/default.jpg'}" alt="">`)
          .join('');

        const productList = order.products.map(p => {
          const attrValues = Object.values(p.attributes || {}).join(', ');
          return `
            <div class="prd">
              <img src="${p.thumbnail || 'assets/images/products/default.jpg'}" alt="">
              <div class="data">
                <h4>${p.title || 'Untitled Product'}</h4>
                <p>${attrValues}</p>
              </div>
              <p class="total"><span>${p.amount}</span> Items</p>
            </div>
          `;
        }).join('');

        const el = document.createElement('div');
        el.className = 'order';
        el.innerHTML = `
          <div class="postHead">
            <div class="leftData">
              <img src="${client.profile_pic || 'assets/images/faces/user1.jfif'}" alt="" class="profilePic acti">
              <div class="userData">
                <h4>${client.username || 'unknown'} <img src="assets/images/badges/${client.verification || 'null'}.png"></h4>
                <div class="group">
                  <p><i class="fi fi-sr-marker"></i> Dar-es-salaam, Tanzania</p>
                  <p><i class="fi fi-sr-calendar"></i> ${new Date(order.created_at).toDateString()}</p>
                </div>
              </div>
            </div>
            <p class="el-status ${status}">${status}</p>
          </div>
          <div class="productsSummary">
            <div class="images">${images}</div>
            <p class="total"><span>${totalProducts}</span> Products</p>
          </div>
          <div class="productsList">${productList}</div>
          <div class="call2act">
            <div class="default-btn btn-action">Order Ready</div>
          </div>
        `;
        ordersList.appendChild(el);

        const btn = el.querySelector('.btn-action');
        if(order.ready) btn.remove();
        btn.addEventListener('click', async () => {
          btn.classList.add("load")
          if (!order.delivered) {
            await fetch(`${MAIN_SERVER}/mark_order_ready`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: order.id })
            })
            .then(rsp => rsp.json())
            .then(js_dt=>{
              console.log(js_dt);
              btn.remove();
              initStatusMessage("Order has been set ready, Successfully!!😁🎉")
              el.querySelector('.el-status').innerText = 'order ready';
              el.querySelector('.el-status').className = 'el-status delivered';
            })
            
          }
        });
      });
  };

  renderOrders();

  searchInput.addEventListener('input', e => {
    renderOrders(e.target.value);
  });
};
async function loadProfileData(id) {
  fetch(`${MAIN_SERVER}/get_user_profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  .then(rsp => rsp.json())
  .then(profile => {
    if (profile.status !== 'success') return;

    const data = profile.data;
    const view = document.querySelector('.profileView.otherUsersProfile');

    // Profile image
    const profileImg = view.querySelector('.profilePhoto');
    profileImg.src = data.profile_pic || 'assets/images/faces/user0.jfif';

    // Name and username
    const nameEl = view.querySelector('.data h2');
    let userDisplayName = data.name || data.full_name || 'Unnamed User';
    if(userDisplayName.length >= 18){
      userDisplayName = userDisplayName.split(" ")[0];
    };
    nameEl.textContent = userDisplayName;

    const usernameEl = view.querySelector('.data p');
    usernameEl.innerHTML = `@${data.username}`;
    
    // Verification badge
    const badge = document.createElement('img');
    badge.src = `assets/images/badges/${data.verification}.png`;
    badge.alt = 'verified';
    usernameEl.appendChild(badge);

    // Bio
    const bioEl = view.querySelector('.biography');
    data.bio = embedLinks(data.bio || '');
    bioEl.textContent = data.bio || 'No bio available.';

    // Optionally add “more” if bio is long
    if (data.bio && data.bio.length > 150) {
      bioEl.innerHTML = `${data.bio.substring(0, 150)}... <b>more</b>`;
      bioEl.querySelector('b').onclick = () => {
        let bioFull = data.bio.replaceAll("\n", "<br>");
        let bioSct = get('.fullBio .bioContent');
        bioSct.innerHTML = `<b>@${data.username}</b> ${bioFull}`;
        getPop('.fullBio');
      };
    }

    // following / followers
    let followedList = JSON.parse(localStorage.getItem('sokoni_followed_users')) || [];
    const followBtn = view.querySelector('.followUser');
    const stats = view.querySelectorAll('.userStats p');
    view.querySelector("i.sendChat").onclick = ()=>{
      getConversation(id, [data.profile_pic, userDisplayName]);
    }

    if (followedList.includes(id)) {
      followBtn.textContent = 'unfollow';
    }else{
      followBtn.textContent = 'follow';
    }
    stats[0].setAttribute('size', '120k'); // followers count
    followBtn.onclick = () => {
      followBtn.classList.toggle('load');
      fetch(`${MAIN_SERVER}/follow_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: localStorage.getItem('sokoni_identity'),
          target_id: id
        })
      })
      .then(rsp => rsp.json())
      .then(res => {
        let followedList = JSON.parse(localStorage.getItem('sokoni_followed_users')) || [];
        if (res.follow_state === 'followed') {
          followBtn.textContent = 'unfollow';
          if (!followedList.includes(id)) followedList.push(id);
        } else if (res.follow_state === 'unfollowed') {
          followBtn.textContent = 'follow';
          followedList = followedList.filter(uid => uid !== id);
        }
        localStorage.setItem('sokoni_followed_users', JSON.stringify(followedList));
        setTimeout(() => followBtn.classList.remove('load'), 500);
      });
    };


    // additional info
    stats[1].setAttribute('size', '1,500'); // sold products
    stats[2].setAttribute('size', '3.5'); // rating


    // Business Location
    const locationEl = view.querySelector('.bussinessLocation .location p.shopAddress');
    const openMaps = view.querySelector('.bussinessLocation .location i.openMaps');

    locationEl.textContent = data.locations[0].address || 'Location not set';
    openMaps.onclick = () => {
      let coords = data.locations[0].coordinates;
      const link = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
      window.open(link, '_blank');
    };

    console.log('User categories:', data.categories);
    console.log('User locations:', data.locations);
    getFloater('.profileView');
  })
  .catch(err => console.error('Error loading profile:', err));
};
async function displayConversations(){
  let rsp = await fetch(`${MAIN_SERVER}/last_conversation`, {
    method: 'POST', credentials: "include",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: localStorage.getItem("sokoni_identity") })
  })
  data = await rsp.json();
  console.log(data);

  let unread = JSON.parse(localStorage.getItem("sokoni_unread")) || {};
  data.forEach(dt=>{
    dt["unread"] = unread[dt["sender_id"]]
  });
  renderChats(data || []);
};
async function getConversation(target_id, user_data) {
  get(".messageProfilePic").src = user_data[0]
  get(".messageFullName").textContent = user_data[1]
  if (!user_data){
    let rsp = await fetch(`${MAIN_SERVER}/get_user_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id })
    })
    data = await rsp.json();
    console.log(data);
  }
  try {
    const chatContainer = document.querySelector('.chatsCont .scrollable');
    chatContainer.innerHTML = "<img src='assets/images/loader_dark.gif' class='textLoader'>";

    getFloater('.chatroom');
    get(".page.chatroom").setAttribute("activeChat", target_id);
    const rsp = await fetch(`${MAIN_SERVER}/get_conversation`, {
      method: 'POST', credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "id": localStorage.getItem("sokoni_identity"),
        target_id: target_id
      })
    });

    const data = await rsp.json();
    if (data.status !== "success") return;
    chatContainer.innerHTML = ""
    // console.log("hellow world")
    // console.log(data);

    data.messages.forEach(msg => {
      const isSent = msg.sender != target_id;
      const msgTime = formatDate(msg.sent_at);
      msg.msg_content = msg.msg_content.replace(/[<>]/g, "");
      if (isSent) {
        let tempSent = {
          "text":`
            <div class="sent">
              <p time="${msgTime}">
                <span>${msg.msg_content}</span>
                <i class="fi fi-rr-check-double"></i>
              </p>
            </div>
          `,
          "image":`
            <div class="sent">
              <p time="${msgTime}">
                <img src="${msg.msg_content}">
                <i class="fi fi-rr-check-double"></i>
              </p>
            </div>
          `,
          "link":`
            <div class="sent">
              <p time="${msgTime}">
                <span>${msg.msg_content}</span>
                <i class="fi fi-rr-check-double"></i>
              </p>
            </div>
          `
        }
        chatContainer.innerHTML += tempSent[msg.msg_type];
      } else {
        let tempRec = {
          "text":`
            <p class="rec" time="${msgTime}">${msg.msg_content}</p>
          `,
          "image":`
            <p class="rec" time="${msgTime}">
              <img src="${msg.msg_content}">
            </p>
          `,
          "link":`
            <p class="rec" time="${msgTime}">${msg.msg_content}</p>
          `,
        }
        chatContainer.innerHTML += tempRec[msg.msg_type];
      }
    });
    setTimeout(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
      });
    }, 1000);

    console.log(target_id)

    document.querySelector('.sendInput .fi-rr-paper-plane').onclick = ()=>{
      sendMessage(target_id);
    };
    document.querySelector('.sendInput input[type="text"]').onkeydown = (e) => {
      if (e.key === 'Enter') sendMessage(target_id);
    };
    document.querySelector('.sendInput input[type="file"]').onchange = ()=>{
      let user_id = localStorage.getItem("sokoni_identity");
      const file = document.querySelector('.sendInput input[type="file"]').files[0];
      if (!file) return;

      const formData = new FormData();
      const filename = `profile_${user_id}${randomString(10)}.${file.type.split("/")[1]}`;
      formData.append("file", file, filename);

      fetch(`${MAIN_SERVER}/upload`, {
        method: "POST", credentials: "include",
        // headers: {
        //   // "Authorization": `Bearer ${localStorage.getItem("sokoni_identity")}`,
        //   "Content-Type": "multipart/form-data"
        // },
        body: formData
      })
      .then(rsp => rsp.json())
      .then(data => {
        if (data.filename) {
          let photoURL = `${MAIN_SERVER}/sokoni_uploads/${data.filename}`;
          sendMessage(target_id, "image", photoURL);
        }
      })
      .catch(err => console.error(err));
    };
  } catch (err) {
    console.error("Conversation Load Error:", err);
  }
};
async function sendMessage(to, type="text", msg_content) {
  try {
    const input = document.querySelector('.sendInput input[type="text"]');
    const content = msg_content || input.value.trim();
    input.value = "";
    if (!content) return;

    const from = localStorage.getItem("sokoni_identity");

    const chatContainer = document.querySelector('.chatsCont .scrollable');
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let tempSent = {
      "text": `
        <div class="sent disabled">
          <p time="${time}">
            <span>${content}</span>
            <i class="fi fi-rr-check"></i>
          </p>
        </div>
      `,
      "image": `
        <div class="sent disabled">
          <p time="${time}">
            <img src="${content}">
            <i class="fi fi-rr-check"></i>
          </p>
        </div>
      `,
      "link": `
        <div class="sent disabled">
          <p time="${time}">
            <span>${content}</span>
            <i class="fi fi-rr-check"></i>
          </p>
        </div>
      `
    };

    chatContainer.innerHTML += tempSent[type];
    setTimeout(() => get(".sent.disabled").classList.remove("disabled"), 100);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const rsp = await fetch(`${MAIN_SERVER}/send_message`, {
      method: 'POST', credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, type, content })
    });

    const data = await rsp.json();

    if (data.status === "success") {
      const lastMsg = chatContainer.querySelector('.sent:last-child i');
      if (lastMsg) lastMsg.className = "fi fi-rr-check-double";
      displayConversations();
    }

  } catch (err) {
    console.error("Send Message Error:", err);
  }
};


async function showLocations() {
  try {
    const userId = localStorage.getItem("sokoni_identity"); // Or however you store JWT
    console.log(userId)
    const response = await fetch(`${MAIN_SERVER}/get_user_locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId })
    });

    const data = await response.json();
    if (!data || !Array.isArray(data)) return;
    localStorage.setItem("sokoni_locations", JSON.stringify(data))

    const container = document.querySelector(".addressList");
    container.innerHTML = ""; // Clear existing addresses

    data.forEach(loc => {
      const div = document.createElement("div");
      div.classList.add("address");

      div.innerHTML = `
        <i class="fi fi-sr-marker"></i>
        <div class="data">
          <p>${loc.address}</p>
          <h4>${loc.title}</h4>
        </div>
        <i class="fi fi-rr-trash" onclick='deleteLocation(${JSON.stringify(loc)})'></i>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load locations:", err);
  }
};
async function addNewLocation(el) {
  el.classList.add("load");
  const locationTitle = get("#locationTitle").value || "New Location";
  try {
    const location = await getUserLocation(locationTitle); // { title, coordinates, address }

    const userId = localStorage.getItem("sokoni_identity"); // adjust if you store user differently
    const response = await fetch(`${MAIN_SERVER}/add_user_location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        location: location
      })
    });

    const data = await response.json();
    if (data.status === "success") {
      showLocations(); // refresh the list
      el.classList.remove("load")
      shutPop(".createNewAddress")
    } else {
      console.error("Failed to add location:", data.message);
    }
  } catch (err) {
    console.error("Error adding location:", err);
  }
};
async function deleteLocation(location) {
  try {
    const userId = localStorage.getItem("sokoni_identity"); // or however you store JWT
    const response = await fetch(`${MAIN_SERVER}/delete_user_location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, location })
    });

    const data = await response.json();
    if (data.status === "success") {
      showLocations(); // Refresh the list after deletion
    } else {
      console.error("Failed to delete location:", data.message);
    }
  } catch (err) {
    console.error("Error deleting location:", err);
  }
};


async function loadMyProfile() {
  const token = localStorage.getItem("sokoni_identity");
  if (!token) return console.error("Missing user token");

  try {
    const res = await fetch(`${MAIN_SERVER}/get_usernames`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: token })
    });

    if (!res.ok) throw new Error("Failed to load user data");
    const data = await res.json();

    if (data.status !== "success") return;

    const user = data.user || {};
    const usernames = data.usernames || [];
    user["name"] = user.name || user.full_name;
    user["firstName"] = user.name.split(" ")[0];
    user["lastName"] = user.name.split(" ")[1];
    get(".profilePhotoDisplay").src = user["profile_pic"] || "assets/images/default.png";
    get(".referalLinkDisplay").textContent = `${location.origin}/#${data["user_id"]}`;
    get(".referalLinkCopy").onclick = ()=>{
      copyClip(`${location.origin}/#${data["user_id"]}`);
      initStatusMessage('Referal link copied to clipboar🙂🙂');
    };
    window.usernamesList = usernames; // keep global for username validation

    document.querySelectorAll("[idTag]").forEach(el => {
      const tag = el.getAttribute("idTag");
      const input = el.querySelector("input") || el.querySelector("textarea") || el;
      if (input && user[tag] !== undefined) input.value = user[tag];
    });

    console.log("Profile data applied successfully.", data);
    data.usernames.push("");
    data.usernames = data.usernames.filter(val => val !== user.username);
    initProfileObserver(data.usernames);
  } catch (err) {
    console.error("Error loading profile:", err);
  }
};


// -----------------------------
// POST RENDER FUNCTION (unchanged logic)
// -----------------------------

async function loadExplorePosts() {
  const grids = document.querySelectorAll('.exploreCont .explorePosts .postGrid');
  grids.forEach(g => g.innerHTML = '<img src="assets/images/loader.gif" class="loaderGif">');

  try {
    const res = await fetch(`${MAIN_SERVER}/get_products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    let posts = await res.json();
    // console.log("Loaded Posts:", posts);
    shuffleArray(posts);

    grids.forEach(g => g.innerHTML = '');

    const PAGE_SIZE = 12; // posts per scroll batch
    let currentIndex = 0;

    function loadBatch() {
      const nextPosts = posts.slice(currentIndex, currentIndex + PAGE_SIZE);
      nextPosts.forEach((post, i) => renderPost(post, grids[i % grids.length]));
      currentIndex += PAGE_SIZE;
    }

    // load first batch
    loadBatch();

    // create a sentinel element to detect scroll bottom
    const sentinel = document.createElement('div');
    sentinel.className = 'scrollSentinel';
    grids[grids.length - 1].appendChild(sentinel);

    // intersection observer for infinite scroll
    const observer = new IntersectionObserver((entries) => {
      const last = entries[0];
      if (last.isIntersecting) {
        observer.unobserve(last.target);
        if (currentIndex < posts.length) {
          loadBatch();
          grids[grids.length - 1].appendChild(sentinel);
          observer.observe(sentinel);
        }
      }
    }, { rootMargin: '100px' });

    observer.observe(sentinel);

  } catch (err) {
    console.error('Error loading explore posts:', err);
    grids.forEach(g => g.innerHTML = '<p class="error">Failed to load explore posts.</p>');
  }
};
function openPostView(post, data, userPic, userName, badge) {
  const postView = get('.postView');
  const add2CartBtn = postView.querySelector('.addToCart');
  const buyRightNow = postView.querySelector('.quickBuy');
  const allSpecs = postView.querySelector('.specsList');

  postView.querySelector('.catRate .category').textContent = data.category || "General";
  postView.querySelector('.postDetails .remain b').textContent = formatMoney(data.stock);
  postView.querySelector('.profilePic').src = userPic;
  postView.querySelector('.profilePic').onclick = () => loadProfileData(post.host_id);
  postView.querySelector('.userData h4').innerHTML = `${userName} <img src="assets/images/badges/${badge}.png">`;
  postView.querySelector('.group').innerHTML = `
    <p><i class="fi fi-sr-marker"></i> Dodoma, Tanzania</p>
    <p><i class="fi fi-sr-calendar"></i> ${formatDate(post.created_at)}</p>`;

  const imgScroll = postView.querySelector('.startup-scroll');
  const navScroll = postView.querySelector('.scroll-nav');
  imgScroll.innerHTML = '<div class="dummy"></div>';
  navScroll.innerHTML = '';

  data.images?.forEach((imgUrl, i) => {
    imgScroll.innerHTML += `<img src="${imgUrl}"/>`;
    navScroll.innerHTML += `<img class="nav ${i === 0 ? 'active' : ''}" src="${imgUrl}"/>`;
  });
  imgScroll.innerHTML += '<div class="dummy"></div>';

  postView.querySelector('.postDetails h1').innerText = data.title;
  postView.querySelector('.postTags').innerHTML = extractHashtags(data.description || '');
  postView.querySelector('.dsc').innerHTML = `<b>@${userName}</b> <span>${(data.description || '').replaceAll("\n", "<br>")}</span>`;
  postView.querySelector('.call2act h2').innerText = `Tzs. ${formatMoney(data.price)}/-`;
  postView.querySelector('.call2act h2').setAttribute('old', `Tsh. ${formatShort(data.price * 1.2)}`);

  // attributes + add to cart logic (same as before)
  allSpecs.innerHTML = '';
  if (Array.isArray(data.attributes)) {
    data.attributes.forEach((attr) => {
      const specItem = document.createElement('div');
      specItem.className = 'specItem';
      specItem.innerHTML = `
        <p>${attr.name}</p>
        <div class="selection postSlt">
          ${attr.values.map(v => {
            const [valName] = v.split(':');
            return `<p class="select" data-raw='${v}'><i class="fi fi-sr-check-circle"></i> ${valName}</p>`;
          }).join('')}
        </div>`;
      allSpecs.appendChild(specItem);

      const selects = specItem.querySelectorAll('.select');
      const firstSelect = selects[0];
      if (firstSelect) firstSelect.classList.add('active');

      selects.forEach(sel => {
        sel.addEventListener('click', () => {
          selects.forEach(s => s.classList.remove('active'));
          sel.classList.add('active');

          let newPrice = data.price;
          allSpecs.querySelectorAll('.select.active').forEach(a => {
            const raw = a.getAttribute('data-raw');
            const [, extra] = raw.split(':');
            if (extra && !isNaN(extra)) newPrice += parseFloat(extra);
          });

          const priceEl = postView.querySelector('.call2act h2');
          priceEl.textContent = `Tzs. ${formatMoney(newPrice)}/-`;
          priceEl.setAttribute('old', `Tsh. ${formatShort(newPrice * 1.2)}`);
        });
      });
    });
  }

  add2CartBtn.onclick = () => {
    add2CartBtn.classList.add('load');
    setTimeout(() => {
      add2CartBtn.classList.remove('load');
      initStatusMessage("Product was Added to Cart Successfully🎉🎉");
    }, 1000);

    const selectedAttributes = {};
    let finalPrice = data.price;

    allSpecs.querySelectorAll('.specItem').forEach(spec => {
      const name = spec.querySelector('p').textContent.trim();
      const active = spec.querySelector('.select.active');
      if (active) {
        const raw = active.getAttribute('data-raw') || '';
        selectedAttributes[name.toLowerCase()] = raw;
      }
    });

    const cartItem = {
      host: {
        id: post.host_id,
        username: userName,
        verification: badge,
        profile_pic: userPic,
        address: "Dodoma, Tanzania"
      },
      product: {
        id: post.id,
        title: data.title,
        price: finalPrice,
        stock: data.stock,
        unit_type: data.unit_type || "Item",
        thumbnail: data.images?.[0] || 'assets/images/products/iphone0.jfif',
        selected_attributes: selectedAttributes
      },
      amount: 1
    };
    console.log(cartItem);

    let cart = JSON.parse(localStorage.getItem('sokoni_cart')) || [];
    const exists = cart.find(item =>
      item.product.id === cartItem.product.id &&
      JSON.stringify(item.product.selected_attributes) === JSON.stringify(cartItem.product.selected_attributes)
    );
    if (exists) exists.amount += 1;
    else cart.push(cartItem);
    localStorage.setItem('sokoni_cart', JSON.stringify(cart));
  };
  buyRightNow.onclick = () => {
    buyRightNow.classList.add('load');
    setTimeout(() => {
      add2CartBtn.classList.remove('load');
      // initStatusMessage("Product was Added to Cart Successfully🎉🎉");
    }, 1000);

    const selectedAttributes = {};
    let finalPrice = data.price;

    allSpecs.querySelectorAll('.specItem').forEach(spec => {
      const name = spec.querySelector('p').textContent.trim();
      const active = spec.querySelector('.select.active');
      if (active) {
        const raw = active.getAttribute('data-raw') || '';
        selectedAttributes[name.toLowerCase()] = raw;
      }
    });

    quickBuyItem = [{
      host: {
        id: post.host_id,
        username: userName,
        verification: badge,
        profile_pic: userPic,
        address: "Dodoma, Tanzania"
      },
      product: {
        id: post.id,
        title: data.title,
        price: finalPrice,
        stock: data.stock,
        unit_type: data.unit_type || "Item",
        thumbnail: data.images?.[0] || 'assets/images/products/iphone0.jfif',
        selected_attributes: selectedAttributes
      },
      amount: 1
    }];
    console.log(quickBuyItem);

    getCheckoutData(quickBuyItem)
    .then(dt=>{
      console.log(dt);
      buyRightNow.classList.remove("load")
    })
  };

  initStartupScroll();
  getFloater('.postView');
};
function renderPost(post, grid) {
  const data = post.data || {};
  const userPic = post.host_profile_pic || 'assets/images/faces/user1.jfif';
  const userName = post.host_username || 'anonymous';
  const badge = post.host_verification || 'null';
  const imageUrl = data.images?.[0] || 'assets/images/products/iphone0.jfif';

  const postCont = document.createElement('div');
  postCont.className = 'postCont';
  postCont.style.backgroundImage = `url(${imageUrl})`;
  postCont.innerHTML = `
    <div class="postHead">
      <div class="leftData">
        <img src="${userPic}" alt="" class="profilePic acti">
        <div class="userData">
          <h4>${userName} <img src="assets/images/badges/${badge}.png"></h4>
          <div class="group">
            <p><i class="fi fi-sr-marker"></i> Dodoma, Tanzania</p>
            <p><i class="fi fi-sr-calendar"></i> ${formatDate(post.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="postActions">
      <i class="fi fi-${["rr", "sr"][Math.round(Math.random())]}-heart"></i>
      <!-- <i class="fi fi-rr-comment-alt-middle"></i> -->
      <i class="fi fi-rr-bookmark"></i>
      <i class="fi fi-sr-star rating">0.0</i>
    </div>
  `;

  postCont.addEventListener('click', () => openPostView(post, data, userPic, userName, badge));
  grid.appendChild(postCont);
};

// -----------------------------
// POST RENDER FUNCTION (unchanged logic)
// -----------------------------


function handleOnlineStatus(){
  const socket = new WebSocket(`${MAIN_SERVER.replace("http", "ws")}/online_status`);

  socket.onopen = () => {
    console.log("Connected to Server: User Online");
    socket.send(localStorage.getItem("sokoni_identity"));
  };
  socket.onclose = () => {
    console.log("Server Disconnected");
  };
  socket.onerror = (err) => {
    console.error("Socket error:", err);
  };
};
function applyCartData() {
 try {
    setTimeout(() => { get(".buyRightNow").classList.remove("load") }, 1000);
  
    const cartCounter = document.querySelector('.cartCounter');
    const cartList = document.querySelector('.cartList');
    const headerTotal = document.querySelector('.shoppingCart .header h2:last-child');
    const cart = JSON.parse(localStorage.getItem('sokoni_cart')) || [];

    cartList.innerHTML = '';
    let total = 0;

    if(cart.length === 0){
      cartList.innerHTML = `<img src="assets/images/empty.png"><p>Oops!! Your cart is Empty.</p>`;
      cartList.classList.add("empty");
      cartCounter.removeAttribute("new");
      headerTotal.textContent = `Tzs. 0/-`;
      return;
    }else{
      cartList.classList.remove("empty");
    }

    cart.forEach((item, i) => {
      // 🔹 Calculate base + attribute extras
      let extra = 0;
      for (const v of Object.values(item.product.selected_attributes || {})) {
        const [, add] = v.split(':');
        if (add && !isNaN(add)) extra += parseFloat(add);
      }

      const realPrice = item.product.price + extra;
      const totalItemPrice = realPrice * item.amount;
      total += totalItemPrice;

      const details = Object.entries(item.product.selected_attributes || {})
        .map(([k, v]) => v.split(':')[0]) // hide ":extra"
        .join(', ');

      const el = document.createElement('div');
      el.className = 'cartItem';
      el.innerHTML = `
        <i class="fi fi-rr-check selectToggle active" onclick="this.classList.toggle('active')"></i>
        <img src="${item.product.thumbnail}">
        <div class="data">
          <div class="profile">
            <img src="${item.host.profile_pic}" alt="">
            <div>
              <h4>${item.host.username} <img src="assets/images/badges/${item.host.verification}.png"></h4>
              <p>${item.host.address}</p>
            </div>
          </div>
          <h3>${item.product.title}</h3>
          <p class="details">${details}</p>
          <div class="priceQty">
            <p class="price">Tsh.${formatMoney(realPrice)}</p>
            <p class="qty">
              <i class="fi fi-rr-minus-small"></i>
              <span unit_type="${item.product.unit_type}">${item.amount}</span>
              <i class="fi fi-rr-plus-small"></i>
            </p>
          </div>
        </div>
      `;

      // 🔹 Quantity controls
      const minus = el.querySelector('.fi-rr-minus-small');
      const plus = el.querySelector('.fi-rr-plus-small');
      const qtySpan = el.querySelector('.qty span');
      const selectToggle = el.querySelector('.selectToggle');

      minus.onclick = () => {
        item.amount--;
        if (item.amount <= 0) {
          el.classList.add('disabled');
          cart.splice(i, 1);
        }
        localStorage.setItem('sokoni_cart', JSON.stringify(cart));
        applyCartData();
      };

      plus.onclick = () => {
        if(item.amount + 1 == item.product.stock) {
          initStatusMessage("Sorry!! You can't add more than that🥲🥹")
          return;
        };
        item.amount++;
        qtySpan.textContent = item.amount;
        localStorage.setItem('sokoni_cart', JSON.stringify(cart));
        applyCartData();
      };

      selectToggle.onclick = () => {
        selectToggle.classList.toggle('active');
        updateTotal();
      };

      cartList.appendChild(el);
    });

    // 🔹 Update header total
    updateTotal();

    function updateTotal() {
      const activeItems = cartList.querySelectorAll('.selectToggle.active');
      let selectedTotal = 0;

      activeItems.forEach((btn, idx) => {
        const item = cart[idx];
        if (item) {
          let extra = 0;
          for (const v of Object.values(item.product.selected_attributes || {})) {
            const [, add] = v.split(':');
            if (add && !isNaN(add)) extra += parseFloat(add);
          }
          const realPrice = item.product.price + extra;
          selectedTotal += realPrice * item.amount;
        }
      });

      headerTotal.textContent = `Tzs. ${formatMoney(selectedTotal)}/-`;
    }

    cartCounter.setAttribute("new", cart.length);
 } catch (error) {
    get(".shoppingCart .cartList").innerHTML = `<p class="error">Failed to load cart data. Error: ${error}</p>`;
 }
};
async function testPayment() {
  let phone = document.querySelector('.pendingPayment .input input').value;
  try {
    const response = await fetch(`${MAIN_SERVER}/test_payment`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // console.log("Payment response:", data);
    return data;
  } catch (err) {
    console.error("Payment error:", err);
    return null;
  }
};
async function submitProfileChanges() {
  const changes = collectProfileData();
  if (Object.keys(changes).length === 0) return;
  let user_id = localStorage.getItem("sokoni_identity");

  getPop(".profileChanges");
  get(".profileChanges .call2action .default-btn").onclick = async () => {
    get(".profileChanges .call2action .default-btn").classList.add("load");
    fetch(`${MAIN_SERVER}/update_user`, {
      method: "POST", credentials: "include",
      headers: JSON_HEAD,
      body: JSON.stringify({ id: user_id, data: changes })
    }).then(rsp => {
      if (rsp.status === 200) {
        setTimeout(() => {
          shutPop(".profileChanges")
          get(".profileChanges .call2action .default-btn").classList.remove("load");
          initStatusMessage("Profile Updated Successfully😁🎉");
        }, 1000);
      }
    });
  };
};
async function profilePicChanges() {
  const profilePhotoUpdate = document.querySelector(".profilePhotoUpdate");
  
  profilePhotoUpdate.addEventListener("change", async () => {
    let user_id = localStorage.getItem("sokoni_identity");
    const file = profilePhotoUpdate.files[0];
    if (!file) return;

    const formData = new FormData();
    const filename = `profile_${randomString(25)}.${file.type.split("/")[1]}`;
    formData.append("file", file, filename);

    fetch(`${MAIN_SERVER}/upload`, {
      method: "POST", credentials: "include",
      // headers: {
      //   // "Authorization": `Bearer ${localStorage.getItem("sokoni_identity")}`,
      //   "Content-Type": "multipart/form-data"
      // },
      body: formData
    })
    .then(rsp => rsp.json())
    .then(data => {
      if (data.filename) {
        fetch(`${MAIN_SERVER}/update_user`, {
          method: "POST", credentials: "include",
          headers: JSON_HEAD,
          body: JSON.stringify({
            id: user_id,
            data: { profile_pic: `${MAIN_SERVER}/sokoni_uploads/${data.filename}` }
          })
        })
        .then(rsp => rsp.json())
        .then(res => {console.log(res); get('.profilePhotoDisplay').src = `${MAIN_SERVER}/sokoni_uploads/${data.filename}`;})
      }
    })
    .catch(err => console.error(err));
  });
};
async function getCheckoutData(cartData) {
  quickBuyItem = undefined;
  const cart = cartData || JSON.parse(localStorage.getItem('sokoni_cart')) || [];
  if (cart.length === 0) return null;
  fetch(`${MAIN_SERVER}/checkout_data`, {
    method: "POST", credentials: "include",
    headers: JSON_HEAD,
    body: JSON.stringify({
      id: localStorage.getItem("sokoni_identity"),
      data: cart,
      location_index: parseFloat(localStorage.getItem("location_index"))
    })
  })
  .then(rsp => rsp.json())
  .then(data => {
    renderPrices(data, 0);
    renderLocations(data);
    getPop('.checkout');
    return data;
  })
  .catch(err => console.error(err));
};
async function verifyPayment(data, btn, cartData) {
  let successAudio = new Audio('assets/audio/success.mp3');
  let failAudio = new Audio('assets/audio/failed.mp3');

  successAudio.volume = 1;
  failAudio.volume = 1;

  setTimeout(async ()=>{
    const url = `https://api.clickpesa.com/third-parties/payments/${data.order}`;
    const options = {method: 'GET', headers: {Authorization: data.token}, body: undefined};

    try {
      console.log("Window focused, checking payment status...");

      const response = await fetch(url, options);
      const nxtData = await response.json();
      let dataStatus = nxtData[0].status;
      console.log("Payment status:", dataStatus);
      
      if(dataStatus == "PROCESSING") {
        verifyPayment(data, btn);
        return;
      }else if(dataStatus == "FAILEDD"){
        failAudio.play();
        btn.classList.remove("load");
        shutPop('.checkout');

        return;
      };
      
      fetch(`${MAIN_SERVER}/place_order`, {
        method: "POST", credentials: "include",
        headers: JSON_HEAD,
        body: JSON.stringify({ 
          id: localStorage.getItem("sokoni_identity"),
          order_ref: data.order,
          token: data.token,
          cart: cartData || JSON.parse(localStorage.getItem('sokoni_cart')) || [],
          location_index: parseFloat(localStorage.getItem("location_index"))
        })
      })
      .then(rsp => rsp.json())
      .then(res => {
        console.log(res);
        if(res.status == "success"){
          successAudio.play();
          fireAll();

          localStorage.removeItem('sokoni_cart');
          btn.classList.remove("load");
          applyCartData();
          shutPop('.checkout');
          getPop('.paymentSuccess');
          console.log("Payment successful");
          return "SUCCESS";
        }else{
          failAudio.play();
          btn.classList.remove("load");
          shutPop('.checkout');
          console.log("Payment failed during order placement");
          return "FAILED";
        }
      });
    } catch (error) {
      console.log("Payment verification error:", error);

      btn.classList.remove("load");
      shutPop('.checkout');
      return "FAILED";
    }
  }, 15000);
};
async function placeOrder(btn, cartData) {
  console.log(cartData);
  const cart = cartData || JSON.parse(localStorage.getItem('sokoni_cart')) || [];
  if (cart.length === 0) return null;
  btn.classList.add("load");
  fetch(`${MAIN_SERVER}/checkout_confirm`, {
    method: "POST", credentials: "include",
    headers: JSON_HEAD,
    body: JSON.stringify({
      id: localStorage.getItem("sokoni_identity"),
      data: cart,
      phone: `255${get("#walletInput input").value.replaceAll("-", "")}`,
      location_index: parseFloat(localStorage.getItem("location_index"))
    })
  })
  .then(rsp => rsp.json())
  .then(data => {
    console.log(data);
    if(data.status !== "success") throw new Error("Order failed");
    verifyPayment(data, btn, cartData)

    // let statusCheck = false;
    // document.onvisibilitychange = () => {
    //   if(statusCheck) return;
    //   statusCheck = true;
    //   verifyPayment(data, btn);
    // };
    // document.onblur = () => {
    //   if(statusCheck) return;
    //   statusCheck = true;
    //   verifyPayment(data, btn);
    // };
  })
  .catch(err => {
    console.error(err);
    btn.classList.remove("load");
  });
};
async function getUserLocation(location_title) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Reverse geocode using OpenStreetMap Nominatim API
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();

        const location = {
          title: location_title,
          coordinates: [latitude, longitude],
          address: data.display_name || ""
        };

        resolve(location);
      } catch (err) {
        reject("Failed to fetch address: " + err);
      }

    }, (error) => {
      reject("Geolocation error: " + error.message);
    }, { enableHighAccuracy: true });
  });
};



// ─── Helper Functions ──────────────────────────────────────────────────────────


function renderLocations(data) {
  const locations = JSON.parse(localStorage.getItem("sokoni_locations") || "[]");
  const container = document.getElementById("locations");
  if (!container) return;
  container.innerHTML = `<i class="fi fi-rr-angle-small-right getOpts"></i>`;

  locations.forEach((loc, idx) => {
    const div = document.createElement("div");
    div.className = "optSlt" + (idx === 0 ? " active" : "");
    div.innerHTML = `
      <i class="fi ${idx === 0 ? "fi-sr-home-location" : "fi-sr-marker"}"></i>
      <div class="data">
        <h4>${loc.title}</h4>
        <p>${loc.address.length > 25 ? loc.address.slice(0, 25) + "..." : loc.address}</p>
      </div>
      <i class="fi fi-rr-check"></i>
    `;
    div.addEventListener("click", () => {
      container.querySelectorAll(".optSlt").forEach(el => el.classList.remove("active"));
      div.classList.add("active");
      localStorage.setItem("location_index", String(idx))
      renderPrices(data, idx)
    });
    container.appendChild(div);
  });
};

function renderPrices(data, location){
  let allPTags = document.querySelectorAll(".checkout p[tag]");
  allPTags[0].textContent = `Tzs.${formatMoney(data.total)}/-`
  allPTags[1].textContent = `Tzs.${(formatMoney(Math.round(data.distances[location] * 450)))}/-`;
  allPTags[2].textContent = `Tzs.${formatMoney(data.total + Math.round(data.distances[location] * 450))}/-`;
};

function collectProfileData() {
  const data = {};
  document.querySelectorAll('[idTag]').forEach(el => {
    const id = el.getAttribute('idTag');
    let value = '';

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      value = el.value.trim();
    } else {
      const inner = el.querySelector('input, textarea, select');
      if (inner) value = inner.value.trim();
    }
    if (value) data[id] = value;
  });
  data["name"] = `${data.firstName} ${data.lastName}`;
  console.log(data)
  return data;
};

function getUserId() {
  let user_id = localStorage.getItem("auth");
  try {
    user_id = JSON.parse(user_id).user.id;
  } catch {
    user_id = "guest";
  }
  return user_id;
};

async function fetchStories() {
  const rsp = await fetch(`${MAIN_SERVER}/get_story`, {
    method: "POST", credentials: "include",
    headers: JSON_HEAD,
    body: JSON.stringify({ id: localStorage.getItem("sokoni_identity") })
  });
  return rsp.json();
};

async function decryptStories(json_data) {
  const parts = json_data.split("uuid-");
  const decrypted = await decrypt(parts[0], `uuid-${parts[1]}`);
  const stories = JSON.parse(decrypted);
  stories.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
  return stories;
};

function clearOldStories(storiesCont) {
  storiesCont.querySelectorAll(".storyCont:not(.addStory)").forEach(el => el.remove());
};

function getStoryViewElements() {
  const storyView = document.querySelector(".floater-pages .storyView");
  return {
    storyView,
    storyImg: storyView.querySelector(".storyImg"),
    storyLine: storyView.querySelector(".storyLine"),
    storyHead: storyView.querySelector(".storyHead .leftData"),
    storyDescr: storyView.querySelector(".descComment p")
  };
};

function groupStories(stories) {
  return stories.reduce((acc, item) => {
    const key = item.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      image: item.story_url,
      date: item.post_date,
      description: item.caption
    });
    return acc;
  }, {});
};

async function fetchHostData(story_id) {
  const rsp = await fetch(`${MAIN_SERVER}/sknpbkdf_rd`, {
    method: "POST", credentials: "include",
    headers: JSON_HEAD,
    body: JSON.stringify({
      collection: "users",
      attribute: "profile,business",
      id: story_id
    })
  });
  return rsp.json();
};

function createStoryElement(story, profile) {
  const newStory = document.createElement("div");
  newStory.className = "storyCont";
  newStory.innerHTML = `
    <div class="story" style='background-image: url(${story[0].image});'>
      <img src="${profile.avatar_url}" class="pinProfile">
    </div>
    <p class='username'>${cropText(profile.username, 11).cropped}</p>`;
  return newStory;
};

function handleStoryClick(story, profile, business, els) {
  let timeout = 0;
  let active_item = -1;
  let window_touch = false;
  const badge = business?.kyc?.verification_type || "null";

  els.storyImg.style.backgroundImage = `url(${story[0].image})`;
  els.storyHead.innerHTML = buildStoryHeader(profile, badge, story[0].date);
  els.storyLine.innerHTML = "";

  story.forEach(() => {
    const line = document.createElement("div");
    line.style = "--timeout: 5s;";
    line.className = "line";
    els.storyLine.appendChild(line);
  });

  els.storyView.addEventListener("touchstart", () => (window_touch = true));
  els.storyView.addEventListener("touchend", () => (window_touch = false));

  const storyInterval = setInterval(() => {
    if (window_touch) return;
    if (timeout === 0) {
      active_item += 1;
      if (active_item >= story.length) {
        document.body.removeAttribute("ios");
        closeFloater(".storyView");
        switchTheme();
        setTimeout(() => { document.body.setAttribute("ios", ""); }, 1000);
        return clearInterval(storyInterval);
      };

      timeout = 5;
      els.storyHead.querySelector(".timing").innerHTML = formatDate(story[active_item].date);
      els.storyImg.style.backgroundImage = `url(${story[active_item].image})`;
      els.storyLine.querySelectorAll(".line")[active_item].classList.add("active");
      els.storyDescr.innerHTML = story[active_item].description;
    }
    timeout -= 1;
  }, 1000);

  getFloater(".storyView");
};

function buildStoryHeader(profile, badge, date) {
  return `
    <img src="${profile.avatar_url}" alt="" class="profilePic">
    <div class="userData">
      <h4>${profile.username} <img src="assets/images/badges/${badge}.png"></h4>
      <div class="group">
        <p><i class="fi fi-sr-marker"></i> ${profile.address}</p>
        <p class="timing"><i class="fi fi-sr-calendar"></i> ${formatDate(date)}</p>
      </div>
    </div>`;
};

function applyRole(){
  let targetElements = [".profileBase.accountSettings"]
  let role = localStorage.getItem("sokoni_role");
  targetElements.forEach(el=>{
    get(el).classList.add(role);
  })
};


//─── Endpoints Initialization ─────────────────────────────────────────────────── 


function initAllEndpoints(){
  window.addEventListener("load", ()=>{
    initGetStories();
    initAddStory();
    loadExplorePosts();
    applyCartData();
    profilePicChanges();
    applyRole();
    displayConversations();
    handleOnlineStatus();
  });
};

initAllEndpoints();