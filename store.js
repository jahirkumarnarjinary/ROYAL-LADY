const GH_USER = "jahirkumarnarjinary";
const GH_REPO = "ROYAL-LADY";
const DB_FILE = "store-data.json";

class StoreEngine {
  constructor() {
    this.rawUrl = `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/${DB_FILE}?t=${Date.now()}`;
    this.apiUrl = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${DB_FILE}`;
    this.data = null;
  }

  async load() {
    // 1. Check local cache first for instant load
    const cached = localStorage.getItem("RL_CACHE_DATA");
    if (cached) {
      try {
        this.data = JSON.parse(cached);
      } catch (e) {}
    }

    // 2. Fetch fresh live data from GitHub repository
    try {
      const res = await fetch(this.rawUrl);
      if (res.ok) {
        const fresh = await res.json();
        // Preserve local session users/orders if GitHub commit is in transit
        if (this.data) {
          const localUsers = this.data.users || [];
          const remoteUsers = fresh.users || [];
          localUsers.forEach(lu => {
            if (!remoteUsers.some(ru => ru.phone === lu.phone)) remoteUsers.push(lu);
          });
          fresh.users = remoteUsers;

          const localOrders = this.data.orders || [];
          const remoteOrders = fresh.orders || [];
          localOrders.forEach(lo => {
            if (!remoteOrders.some(ro => ro.id === lo.id)) remoteOrders.push(lo);
          });
          fresh.orders = remoteOrders;
        }
        this.data = fresh;
        this.saveLocal();
      }
    } catch (e) {
      console.warn("Offline / Local relay mode active");
    }

    if (!this.data) {
      this.data = {
        adminConfig: {
          adminIdHash: "8b78ec2ad6dae1b2f4f107f9cbf561876800532f14624b7a12a52bb888a705e4",
          adminPassHash: "9e5c4a3ffb1fa0435ffea49a9042b4d5a9fa264dfa98e1cb1cfbc0b29ff04b28",
          upiId: "nikashnarjinary75@okaxis",
          upiName: "ROYAL LADY STORE",
          storePhone: "7384512297",
          storeEmail: "nikashnarjinary75@gmail.com",
          storeAddress: "Najiran Deutikhata, PO: Baruipara, PS: Tufanganj, Dist: Cooch Behar, PIN: 736207",
          socialLinks: {
            instagram: "https://instagram.com",
            facebook: "https://facebook.com",
            whatsapp: "https://wa.me/917384512297",
            youtube: "https://youtube.com"
          },
          owner: {
            name: "Jahir Narjinary",
            title: "Founder & Managing Director",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            bio: "Dedicated to bringing authentic luxury, handcrafted bridal elegance, and verified premium lifestyle apparel to every woman with transparency and speed."
          }
        },
        users: [],
        products: [],
        orders: []
      };
      this.saveLocal();
    }

    return this.data;
  }

  saveLocal() {
    localStorage.setItem("RL_CACHE_DATA", JSON.stringify(this.data));
  }

  // Live Cloud Synchronizer directly targeting GitHub REST API
  async syncToCloud(commitMsg = "Store Data Synchronized") {
    this.saveLocal();
    const token = sessionStorage.getItem("RL_SECURE_TOKEN");
    if (!token) {
      return { success: false, message: "Token missing. Please re-authenticate." };
    }

    let sha = null;
    try {
      const getRes = await fetch(`${this.apiUrl}?ref=main&t=${Date.now()}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }
    } catch (err) {
      console.error("SHA extraction error:", err);
    }

    const utf8Bytes = unescape(encodeURIComponent(JSON.stringify(this.data, null, 2)));
    const content = btoa(utf8Bytes);

    try {
      const pushRes = await fetch(this.apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({ message: commitMsg, content, branch: "main", sha })
      });

      if (pushRes.ok) {
        return { success: true, message: "Live Global Sync Complete! Updated across all devices worldwide." };
      } else {
        const errJson = await pushRes.json();
        return { success: false, message: `GitHub Sync Error (${pushRes.status}): ${errJson.message || 'Push rejected'}` };
      }
    } catch (err) {
      return { success: false, message: "Network connection failure during cloud commit." };
    }
  }
}

window.engine = new StoreEngine();