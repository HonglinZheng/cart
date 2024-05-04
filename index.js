const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const updateCart = (id) => {
    let isPresent;
    fetch(`${URL}/cart`)
      .then(response => { return response.json() })
      .then(cartData => {
        isPresent = cartData.some(item => item.id === Number(id));
        console.log(`ID ${id} is in the cart:`, isPresent);
      })
      .then(() => {
        if (!isPresent) { //this item hasn't been added to cart
          console.log("this item hasn't been added to cart");
          fetch(`${URL}/inventory/${id}`)
            .then(response => response.json())
            .then(item => {
              const updatedItem = { ...item };
              return fetch(`${URL}/cart`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedItem),
              });
            })
        } else {//this item already inside cart
          let addedCount = 0;
          console.log("this item already inside cart");
          fetch(`${URL}/inventory/${id}`)
            .then(response => response.json())
            .then(item => { addedCount = item.count; })
            .then(() => {return fetch(`${URL}/cart/${id}`);})
            .then(response => response.json())
            .then(item => {
              const updatedItem = { ...item, count: item.count + addedCount };
              return fetch(`${URL}/cart/${id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedItem),
              });
            })
        }
      })
  };

  const deleteFromCart = (id) => {
    fetch(`${URL}/cart/${id}`, { method: "DELETE" })
    return fetch(`${URL}/cart`).
      then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  const minusCount = (id) => {
    fetch(`${URL}/inventory/${id}`)
      .then(res => res.json())
      .then(item => {
        if (item.count === 0) {
          return fetch(`${URL}/inventory`).then((res) => res.json());
        }
        const updatedItem = { ...item, count: item.count - 1 };
        return fetch(`${URL}/inventory/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        });
      })
  };

  const plusCount = (id) => {
    fetch(`${URL}/inventory/${id}`)
      .then(res => res.json())
      .then(item => {
        const updatedItem = { ...item, count: item.count + 1 };
        return fetch(`${URL}/inventory/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        });
      })
      .then(res => res.json());
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  return {
    getCart,
    updateCart,
    getInventory,
    deleteFromCart,
    checkout,
    plusCount,
    minusCount,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
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
    deleteFromCart,
    checkout,
    plusCount,
    minusCount,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    deleteFromCart,
    checkout,
    plusCount,
    minusCount,
  };
})();

const View = (() => {
  const inventorylistEl = document.querySelector(".inventorylist");
  const cartlistEl = document.querySelector(".cartlist");

  const renderCart = (cart) => {
    let cartTemp = "";

    cart.forEach((item) => {
      const content = item.content;
      console.log(content);
      const liTemp = `<li id=${item.id}>
   <span>${content} * ${item.count}</span>
    <button class="cart__delete-btn">delete</button>
    </li>`;
      cartTemp += liTemp;
    });
    cartlistEl.innerHTML = cartTemp;
  };

  const renderInventory = (inventory) => {
    let Temp = "";
    inventory.forEach((item) => {
      const content = item.content;
      console.log(content + " has " + item.count);
      const liTemp = `<li id=${item.id}>
   <span>${content}</span>
   <button class="inventory__minus-btn">-</button>
   <span>${item.count}</span>
    <button class="inventory__plus-btn">+</button>
    <button class="inventory__addToCart-btn">add to cart</button>
    </li>`;
      Temp += liTemp;
    });
    inventorylistEl.innerHTML = Temp;
  };
  return {
    renderInventory, renderCart, inventorylistEl, cartlistEl,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      state.inventory = data;
    });
    model.getCart().then((data) => {
      state.cart = data;
    });
  };

  const handleUpdateAmount = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__minus-btn") {
        const id = element.parentElement.getAttribute("id");
        model.minusCount(id);
        model.getInventory().then((data) => {
          state.inventory = data;
          view.renderInventory(state.inventory);
        });
      } else if (element.className === "inventory__plus-btn") {
        const id = element.parentElement.getAttribute("id");
        model.plusCount(id).then((data) => {
          state.inventory = data;
          view.renderInventory(state.inventory);
        });
      }
    });

  };

  const handleAddToCart = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__addToCart-btn") {
        const id = element.parentElement.getAttribute("id");
        model.updateCart(id);
        model.getCart().then((data) => {
          state.cart = data;
        });
      }
    });
  };

  const handleDelete = () => {
    view.cartlistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "cart__delete-btn") {
        const id = element.parentElement.getAttribute("id");
        model.deleteFromCart(id).then((data) => {
          state.cart = data;
        });
      }
    });
  };

  const handleCheckout = () => {
    document.querySelectorAll('.checkout-btn').forEach(button => {
      button.addEventListener('click', function() {
          model.checkout();
      })
    })
   };
  const bootstrap = () => {
    init();
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
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
