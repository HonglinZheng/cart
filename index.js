const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`)
      .then((res) => res.json()) // use then() to wait fetch to complete and to return a new promise
      .then(item => {
        const updatedItem = { ...item, count: newAmount };
        return fetch(`${URL}/cart/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        });
      })
  };

  const deleteFromCart = async(id) => {
    await fetch(`${URL}/cart/${id}`, { method: "DELETE" }).then((res) => res.json());
    return await getCart();
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };


  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #itemCounts;
    #cart;
    #itemsPerPage;
    #totalItemCount;
    #pageNum;
    #start;
    #end;
    #currentIndex;

    constructor() {
      this.#inventory = [];
      this.#cart = [];
      this.#itemsPerPage = 5;
      this.#currentIndex = 0;
      this.#itemCounts = {};
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }
    get itemCounts() {
      return this.#itemCounts;
    }
    get start(){
      return this.#start;
    }

    get end(){
      return this.#end;
    }
    
    get currentIndex(){
      return this.#currentIndex;
    }
    get pageNum(){
      return this.#pageNum;
    }

    set totalItemCount(num){
      this.#totalItemCount = num;
      this.#pageNum = Math.ceil(this.#totalItemCount / this.#itemsPerPage);
    }
    set currentIndex(theIndex){
      this.#currentIndex = theIndex;
      this.#start = theIndex * this.#itemsPerPage;
      this.#end = Math.min(this.#start + this.#itemsPerPage, this.#totalItemCount);
    }
    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      newInventory.forEach((item) => {
        this.#itemCounts[item.id] = this.#itemCounts[item.id] || 0;
      });
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  const inventorylistEl = document.querySelector(".inventorylist");
  const cartlistEl = document.querySelector(".cartlist");
  const pageButtonContainerEl = document.querySelector(".pagination");
  const itemsPerPage = 5;

  const renderPagination = (inventory) => {
    const totalItemCount = inventory.length;
    let pageNum = Math.ceil(totalItemCount / itemsPerPage);
    let paginationTemp = "";
    paginationTemp += '<button class="pagination__prev-btn">Prev</button>';
    for (let i = 0; i < pageNum; i++)  {
      const liTemp = `<button class="page${i}">${i+1}</button>`;
      paginationTemp += liTemp;
    }
    paginationTemp += '<button class="pagination__next-btn">Next</button>';
    pageButtonContainerEl.innerHTML = paginationTemp;
  }

  const renderCart = (cart) => {
    let cartTemp = "";
    cart.forEach((item) => {
      const content = item.content;
      const liTemp = `<li id=cart-${item.id}>
   <span>${content} * ${item.count}</span>
    <button class="cart__delete-btn">delete</button>
    </li>`;
      cartTemp += liTemp;
    });
    cartlistEl.innerHTML = cartTemp;
  };

  const renderInventory = (inventory, itemCounts, theStart, theEnd) => {
    let Temp = "";
    for (let i = theStart; i < theEnd; i++) {
      item = inventory[i];
      const liTemp = `<li id=inventory-${item.id}>
   <span>${item.content}</span>
   <button class="inventory__minus-btn">-</button>
   <span>${itemCounts[item.id]}</span>
    <button class="inventory__plus-btn">+</button>
    <button class="inventory__addToCart-btn">add to cart</button>
    </li>`;
      Temp += liTemp;
    }
    inventorylistEl.innerHTML = Temp;
  };
  return {
    renderPagination, renderInventory, renderCart, pageButtonContainerEl, inventorylistEl, cartlistEl,
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init = async() => {
    console.log("Initiating...");
    await model.getInventory().then((data) => {
      state.inventory = data;
      state.totalItemCount = data.length;
      state.currentIndex = 0;
    });
    await model.getCart().then((data) => {
      state.cart = data;
    });
  };

  const handlePage = () => {
    view.pageButtonContainerEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "pagination__prev-btn" && state.currentIndex >= 1) {
          //go to the previous page
          state.currentIndex--;
          view.renderInventory(state.inventory, state.itemCounts, state.start, state.end);
      } else if (element.className === "pagination__next-btn" && state.currentIndex < state.pageNum-1) {
          //go to the next page
          state.currentIndex++;
          view.renderInventory(state.inventory, state.itemCounts, state.start, state.end);
      } else if (Array.from(element.classList).some(cls => cls.startsWith('page'))){
          //go to the selected page
          let match = element.className.match(/^page(\d+)$/);
          state.currentIndex = match ? Number(match[1]) : -1;
          view.renderInventory(state.inventory, state.itemCounts, state.start, state.end);
      }
      handlePageColor();
      }
    );
  };

  const handlePageColor = async()=>{
    // not selected pages are black
    document.querySelectorAll('[class^="page"]').forEach(page => {
      page.style.color = 'black';
    });
    //selected page is red
    document.querySelectorAll(`.page${state.currentIndex}`).forEach(page=>{page.style.color="red";})
  }

  const handleUpdateAmount = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__minus-btn") {
        const id = Number(element.parentElement.id.split('-')[1]);
        if (state.itemCounts[id] > 0)
          state.itemCounts[id]--;
      } else if (element.className === "inventory__plus-btn") {
        const id = Number(element.parentElement.id.split('-')[1]);
        state.itemCounts[id]++;
      }
      view.renderInventory(state.inventory, state.itemCounts, state.start, state.end);
    });

  };

  const handleAddToCart = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__addToCart-btn") {
        const currentID = Number(element.parentElement.id.split('-')[1]);
        const addCount = state.itemCounts[currentID];
        if (addCount === 0) {
          console.log("disable addToCart btn when addCount===0");
          return;
        }
        const presentItem = state.cart.find(item => item.id === currentID);
        if (presentItem) {// the item is present in cart; need update
          (async () => {
            const currentCount = presentItem.count;
            await model.updateCart(currentID, currentCount + addCount);
            const data = await model.getCart();
            state.cart = data;//set cart
          })();
        } else {// the item is not in cart; need add
          (async () => {
            const inventoryItem = state.inventory.find(item => item.id === currentID);
            const newItem = {
              content: inventoryItem.content,
              id: currentID,
              count: addCount
            };
            await model.addToCart(newItem);
            const data = await model.getCart();
            state.cart = data;
          })();
        }
      }
    });

  };

  const handleDelete = () => {
    view.cartlistEl.addEventListener("click", async(event) => {
      const element = event.target;
      if (element.className === "cart__delete-btn") {
        const id = Number(element.parentElement.id.split('-')[1]);
        state.cart = await model.deleteFromCart(id);
      }
    });
  };

  const handleCheckout = () => {
    document.querySelectorAll('.checkout-btn').forEach(button => {
      button.addEventListener('click', async function () {
        await model.checkout();
        state.cart = [];
      });
    })
  };
  const bootstrap = () => {
    state.subscribe(() => {
      console.log("SUBSCRIBING...");
      view.renderInventory(state.inventory, state.itemCounts, state.start, state.end);
      view.renderCart(state.cart);
      view.renderPagination(state.inventory);
      handlePageColor();
    });
    init();
    handlePage();
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();

/*
(1) store inventory number locally
(2) API module only responsible for making API only, don't put too much logic(controller or somewhere else)
(3) View only responsible for generating HTML
(4) Controller only reacts to user interaction
(5) model is where you store the state and it's the single source of the truth
(6) In controller don't add UI to the HTML directly; update state first; let state do UI
(7) DEcoupling centralize the logic 
*/
