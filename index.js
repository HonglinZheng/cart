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
    //variables for pagination
    #itemsPerPage;
    #totalInventoryCount;
    #inventoryPageNum;
    #inventoryStart;
    #inventoryEnd;
    #currentInventoryIndex;
    #totalCartCount;
    #cartPageNum;
    #cartStart;
    #cartEnd;
    #currentCartIndex;

    constructor() {
      this.#inventory = [];
      this.#cart = [];
      this.#itemsPerPage = 5;
      this.#currentInventoryIndex = 0;
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
    get inventoryStart(){
      return this.#inventoryStart;
    }

    get inventoryEnd(){
      return this.#inventoryEnd;
    }
    
    get currentInventoryIndex(){
      return this.#currentInventoryIndex;
    }
    get inventoryPageNum(){
      return this.#inventoryPageNum;
    }

    get cartStart(){
      return this.#cartStart;
    }

    get cartEnd(){
      return this.#cartEnd;
    }
    
    get cartIndex(){
      return this.#currentCartIndex;
    }
    get cartPageNum(){
      return this.#cartPageNum;
    }
    get currentCartIndex(){
      return this.#currentCartIndex;
    }
    set cartEnd(num){
      this.#cartEnd = num;
    }
    set cartStart(num){
      this.#cartStart = num;
    }
    set totalInventoryCount(num){
      this.#totalInventoryCount = num;
      this.#inventoryPageNum = Math.ceil(this.#totalInventoryCount / this.#itemsPerPage);
    }
    
    set currentInventoryIndex(theIndex){
      this.#currentInventoryIndex = theIndex;
      this.#inventoryStart = theIndex * this.#itemsPerPage;
      this.#inventoryEnd = Math.min(this.#inventoryStart + this.#itemsPerPage, this.#totalInventoryCount);
      this.#onChange();
    }

    set totalCartCount(num){
      this.#totalCartCount = num;
      this.#cartPageNum = Math.ceil(this.#totalCartCount / this.#itemsPerPage);
    }
    
    set currentCartIndex(theIndex){
      this.#currentCartIndex = theIndex;
      this.#cartStart = theIndex * this.#itemsPerPage;
      this.#cartEnd = Math.min(this.#cartStart + this.#itemsPerPage, this.#totalCartCount);
      this.#onChange();
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#totalCartCount=newCart.length;
      if (this.#cartPageNum < Math.ceil(this.#totalCartCount / this.#itemsPerPage)){
        this.#currentCartIndex = this.#cartPageNum;
        this.#cartPageNum = Math.ceil(this.#totalCartCount / this.#itemsPerPage);
        this.#cartStart = this.#currentCartIndex * this.#itemsPerPage;
      }
      this.#cartEnd = Math.min(this.#cartStart + this.#itemsPerPage, this.#totalCartCount);
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
  const inventoryPageButtonContainerEl = document.querySelector(".inventoryPagination");
  const cartPageButtonContainerEl = document.querySelector(".cartPagination");
  const itemsPerPage = 5;

  const renderInventoryPagination = (inventory) => {
    const totalItemCount = inventory.length;
    let inventoryPageNum = Math.ceil(totalItemCount / itemsPerPage);
    let paginationTemp = "";
    paginationTemp += '<button class="pagination__prev-btn">Prev</button>';
    for (let i = 0; i < inventoryPageNum; i++)  {
      const liTemp = `<button class="page-inventory-${i}">${i+1}</button>`;
      paginationTemp += liTemp;
    }
    paginationTemp += '<button class="pagination__next-btn">Next</button>';
    inventoryPageButtonContainerEl.innerHTML = paginationTemp;
  }
  const renderCartPagination = (cart) => {
    const totalCartCount = cart.length;
    let cartPageNum = Math.ceil(totalCartCount / itemsPerPage);
    let paginationTemp = "";
    paginationTemp += '<button class="pagination__prev-btn">Prev</button>';
    for (let i = 0; i < cartPageNum; i++)  {
      const liTemp = `<button class="page-cart-${i}">${i+1}</button>`;
      paginationTemp += liTemp;
    }
    paginationTemp += '<button class="pagination__next-btn">Next</button>';
    cartPageButtonContainerEl.innerHTML = paginationTemp;
  }

  const renderCart = (cart, theStart, theEnd) => {
    let cartTemp = "";
    for (let i = theStart; i < theEnd; i++) {
      let item = cart[i];
      if(!item){
        return;
      }
      const content = item.content;
      const liTemp = `<li id=cart-${item.id}>
   <span>${content} X ${item.count}</span>
    <button class="cart__delete-btn">delete</button>
    </li>`;
      cartTemp += liTemp;
    }
    cartlistEl.innerHTML = cartTemp;
  };

  const renderInventory = (inventory, itemCounts, theStart, theEnd) => {
    let Temp = "";
    for (let i = theStart; i < theEnd; i++) {
      let item = inventory[i];
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
    renderInventoryPagination, renderCartPagination, renderInventory, renderCart, cartPageButtonContainerEl, inventoryPageButtonContainerEl, inventorylistEl, cartlistEl,
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init =() => {
    console.log("Initiating...");
    model.getInventory().then((data) => {
      state.totalInventoryCount = data.length;
      state.inventory = data;
      state.currentInventoryIndex = 0;
    });
    model.getCart().then((data) => {
      state.totalCartCount = data.length;
      state.cart = data;
      state.currentCartIndex = 0;
    });
  };

  const handleInventoryPage = () => {
    view.inventoryPageButtonContainerEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "pagination__prev-btn" && state.currentInventoryIndex >= 1) {
          //go to the previous page
          state.currentInventoryIndex--;
      } else if (element.className === "pagination__next-btn" && state.currentInventoryIndex < state.inventoryPageNum-1) {
          //go to the next page
          state.currentInventoryIndex++;
      } else if (Array.from(element.classList).some(cls => cls.startsWith('page'))){
          //go to the selected page
          let match = element.className.match(/^page-inventory-(\d+)$/);
          state.currentInventoryIndex = match ? Number(match[1]) : -1;
      }
      handlePageColor();
      }
    );
  };

  const handleCartPage = () => {
    view.cartPageButtonContainerEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "pagination__prev-btn" && state.currentCartIndex >= 1) {
          //go to the previous page
          console.log("go to previous page");
          state.currentCartIndex--;
      } else if (element.className === "pagination__next-btn" && state.currentCartIndex < state.cartPageNum-1) {
          //go to the next page
          console.log("go to next page");
          state.currentCartIndex++;
      } else if (Array.from(element.classList).some(cls => cls.startsWith('page'))){
          //go to the selected page
          let match = element.className.match(/^page-cart-(\d+)$/);
          state.currentCartIndex = match ? Number(match[1]) : -1;
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
    document.querySelectorAll(`.page-inventory-${state.currentInventoryIndex}`).forEach(page=>{page.style.color="red";})
    document.querySelectorAll(`.page-cart-${state.currentCartIndex}`).forEach(page=>{page.style.color="red";})
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
      view.renderInventory(state.inventory, state.itemCounts, state.inventoryStart, state.inventoryEnd);
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
            state.cart = data;
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
  const bootstrap = async() => {
    state.subscribe(() => {
      console.log("SUBSCRIBING...");
      view.renderInventory(state.inventory, state.itemCounts, state.inventoryStart, state.inventoryEnd);
      view.renderCart(state.cart, state.cartStart, state.cartEnd);
      view.renderInventoryPagination(state.inventory);
      view.renderCartPagination(state.cart);
      handlePageColor();
    });
    init();
    handleInventoryPage();
    handleCartPage();
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
