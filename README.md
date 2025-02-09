<div align="center">

# 🏠 House Price Prediction System (HouseIQ)

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=22&duration=3000&color=0F766E&center=true&vCenter=true&width=750&lines=Predict+House+Prices+Using+Machine+Learning;Full-Stack+Flask+Dashboard+%2B+ML+Pipeline;Real-Time+Predictions+with+Confidence+Scores;Built+for+Practical+Data-Driven+Applications" alt="Typing SVG" />
</p>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-WebApp-black?style=for-the-badge&logo=flask)
![Machine Learning](https://img.shields.io/badge/MachineLearning-ScikitLearn-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Repo Stars](https://img.shields.io/github/stars/Washim-8/House-Price-Prediction?style=for-the-badge)
![Repo Forks](https://img.shields.io/github/forks/Washim-8/House-Price-Prediction?style=for-the-badge)

</div>

---

## 📌 Overview

**HouseIQ** is a full-stack machine learning application designed to estimate property prices based on key features like built-up area, room count, and geographical location. Integrating a trained regression model with a clean, responsive web dashboard, the system processes user inputs to instantly display real-time predictions and statistical confidence insights.

Beyond a simple predictive model, this project demonstrates a complete, end-to-end data pipeline—from dataset preprocessing and model training to REST API deployment and dynamic UI charting. It serves as a practical, scalable foundation for property analysis, business intelligence, and real-world ML deployment workflows.

---

## ✨ Features

- **🏠 Real-Time Property Valuation:** Generate instant, accurate price estimates based on structured input data.
- **📊 Confidence & Reliability Scoring:** Every prediction includes a confidence score and a calculated interval for context.
- **🤖 Intelligent Model Selection:** Automatically evaluates multiple regression approaches (including Linear Regression and Random Forest), saving the best-performing model.
- **🌐 Full-Stack SaaS Dashboard:** A visually engaging Flask-powered interface with real-time analytics.
- **📈 Interactive Trend Analysis:** Visualizes recent predictions and historical data using interactive charts dynamically updated in the browser.
- **💾 Local History & Export:** Keeps track of session predictions locally, allowing users to effortlessly export their analysis to CSV.
- **🎨 Dynamic Theming:** Switch between premium UI color palettes dynamically without reloading the app.
- **⚙️ Admin API Support:** Developer-ready endpoints to securely upload new training datasets and trigger model retraining instantly.

---

## 🛠 Tech Stack

- **Core Language:** Python
- **Machine Learning:** Scikit-Learn
- **Data Engineering:** Pandas, NumPy
- **Backend Architecture:** Flask, REST APIs
- **Frontend UI/UX:** HTML5, CSS3, Vanilla JavaScript
- **Data Visualization:** Chart.js, Matplotlib (for backend analysis)
- **Tooling & Environment:** Git, VS Code, Jupyter Notebooks

---

## 📂 Project Structure

```text
├── app.py                  # Core Flask application and REST API routing
├── model_training.py       # ML pipeline for preprocessing, training, and model evaluation
├── dataset/                # Raw and processed CSV datasets
├── models/                 # Saved machine learning model artifacts (.pkl files)
├── notebooks/              # Jupyter notebooks for EDA and algorithm experimentation
├── services/               # Modular business logic (prediction serving, data scaling)
├── static/                 # Static frontend assets (CSS stylesheets, JS logic, icons)
├── templates/              # HTML templates spanning the core dashboard & UI layer
├── utils/                  # Application configuration, error handling, and logging
└── requirements.txt        # Recommended Python dependencies
```

---

## ⚙️ How It Works

1. **Data Ingestion:** The dataset is securely loaded into the pipeline using Pandas.
2. **Preprocessing & Cleaning:** Outliers are removed, missing values are handled, and categorical variables (like location) are properly encoded.
3. **Model Engineering:** Multiple regression algorithms are trained and evaluated on testing splits.
4. **Artifact Generation:** The highest-performing model is serialized and saved within the `models/` directory for production use.
5. **User Interaction:** A user inputs property metrics natively through the responsive interactive dashboard.
6. **Backend Processing:** Flask intercepts the payload, applies identical preprocessing to the input, and feeds it safely to the ML model.
7. **Insight Delivery:** The model computes the optimal price, appending a confidence threshold, then instantly updates the frontend charts and tables.

---

## ▶️ Installation & Setup

Follow these simple steps to run HouseIQ locally:

**1. Clone the repository**
```bash
git clone https://github.com/Washim-8/House-Price-Prediction.git
cd House-Price-Prediction
```

**2. Set up a virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

**3. Install required dependencies**
```bash
pip install -r requirements.txt
```

**4. Train the Machine Learning model**
```bash
# Triggers the training pipeline and generates model artifacts
python model_training.py
```

**5. Launch the application**
```bash
python app.py
```
> 📍 Open your browser and navigate to **http://127.0.0.1:5003**

---

## 📸 Screenshots & Demo

*(Add high-quality screenshots or GIFs of your active dashboard here)*

- **Dashboard UI Overview:** Showcase the cleanly structured metrics and interface.
- **Prediction Result Card:** Display an example of an instant estimated price alongside confidence values.
- **Analytics Charts:** Highlight the built-in tracking graphs that visualize data over time.

### 🎥 Demo GIF Ideas:
- Generating an instant property valuation.
- Demonstrating the seamless dashboard theme toggling.
- CSV data export workflow and tracking history updates.

---

## 🚀 Future Improvements

- **Persistent Database Integration:** Migrate from local session modeling to a persistent SQL/NoSQL database (e.g., PostgreSQL or MongoDB) for robust prediction history.
- **Cloud Deployment:** Containerize the application with Docker and deploy to scalable platforms like AWS or Render.
- **User Authentication:** Introduce secure user accounts globally saving distinct dashboards per user.
- **Advanced Predictive Modeling:** Incorporate deep learning or ensemble architectures such as XGBoost arrays to heighten prediction accuracy.

---

## 👨‍💻 About the Developer

I am **Washim Shaikh**, an aspiring Software Engineer driven by a deep fascination with building scalable, intelligent systems that translate directly into real-world impact. My core foundation relies heavily on rigorous computer science principles logically extended into the fields of artificial intelligence, machine learning, and full-stack architecture. 

Throughout my journey, I have prioritized practical application over pure theory, architecting solutions across a wide range of use cases—from systems that connect farmers directly to commercial buyers (AgriTrade), to developing sophisticated personal finance trackers and highly responsive LLM-based intelligent chat environments. My philosophy remains tightly rooted in writing clean logic, deploying thoughtfully robust architectures, and creating premium, seamless user experiences.

I am currently rapidly expanding my toolkits to focus heavily on scalable cloud deployment structures and production-level machine learning implementations.

---

## 📬 Contact

<div align="left">

- **Email:** <a href="mailto:washimshaikh33@gmail.com">washimshaikh33@gmail.com</a>
- **Phone:** +91 8884958185
- **GitHub:** <a href="https://github.com/Washim-8" target="_blank">github.com/Washim-8</a>
- **LinkedIn:** <a href="https://www.linkedin.com/in/washim-shaikh-349868281/" target="_blank">Washim Shaikh</a>

</div>

**Feel free to connect for meaningful collaborations, discussions, or opportunities.**

---

<div align="center">

### 📊 GitHub Stats

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Washim-8&show_icons=true&theme=transparent" alt="Washim's GitHub Stats" />
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=Washim-8&theme=transparent" alt="Washim's GitHub Streak" />
</p>

</div>

---

## 📄 License

This project is open-source and licensed under the **MIT License**.

<div align="center">

✨ *Built with an emphasis on real-world capabilities, clean system architecture, and scalable ML engineering.*

</div>
