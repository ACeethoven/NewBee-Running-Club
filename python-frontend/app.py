import streamlit as st
import requests
import pandas as pd
import plotly.express as px
from typing import Dict, List, Optional

# Configure the page
st.set_page_config(
    page_title="NewBee Running Club",
    page_icon="🏃‍♀️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Base URL
API_BASE_URL = "http://localhost:8000"

def fetch_api_data(endpoint: str, params: Optional[Dict] = None) -> Optional[List[Dict]]:
    """Fetch data from the API endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}{endpoint}", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        st.error(f"Connection Error: {e}")
        return None

def main():
    st.title("🏃‍♀️ NewBee Running Club")
    st.markdown("---")
    
    # Sidebar navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.selectbox(
        "Choose a page",
        ["Home", "Publications", "Stocks", "Authors", "Analytics"]
    )
    
    if page == "Home":
        show_home_page()
    elif page == "Publications":
        show_publications_page()
    elif page == "Stocks":
        show_stocks_page()
    elif page == "Authors":
        show_authors_page()
    elif page == "Analytics":
        show_analytics_page()

def show_home_page():
    st.header("Welcome to NewBee Running Club")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📚 Random Book Recommendation")
        if st.button("Get Random Book"):
            book_data = fetch_api_data("/randombook")
            if book_data:
                st.success(f"**{book_data['title']}**")
                if book_data.get('publication_url'):
                    st.markdown(f"[Read More]({book_data['publication_url']})")
    
    with col2:
        st.subheader("📈 Top Performing Stocks")
        top_stocks = fetch_api_data("/home/top-stocks", {"limit": 5})
        if top_stocks:
            stocks_df = pd.DataFrame(top_stocks)
            st.dataframe(stocks_df[['symbol', 'field', 'market_cap']], hide_index=True)
    
    st.subheader("📄 Latest Research Papers")
    papers = fetch_api_data("/home/latest-papers", {"limit": 10})
    if papers:
        for paper in papers:
            with st.expander(f"{paper['title'][:80]}..."):
                st.write(f"**Type:** {paper['type']}")
                st.write(f"**Published:** {paper.get('publish_date', 'N/A')}")
                if paper.get('publication_url'):
                    st.markdown(f"[Read Paper]({paper['publication_url']})")

def show_publications_page():
    st.header("📚 Publications")
    
    col1, col2 = st.columns([3, 1])
    
    with col2:
        st.subheader("Filters")
        pub_type = st.selectbox("Publication Type", ["All", "Book", "Conference", "Journal"])
        limit = st.slider("Number of results", 5, 50, 10)
    
    with col1:
        if pub_type == "All":
            papers = fetch_api_data("/home/latest-papers", {"limit": limit})
        else:
            papers = fetch_api_data("/home/latest-papers", {"limit": limit})
            
        if papers:
            st.subheader(f"Found {len(papers)} publications")
            
            for paper in papers:
                with st.container():
                    st.markdown(f"**{paper['title']}**")
                    st.write(f"Type: {paper['type']} | Published: {paper.get('publish_date', 'N/A')}")
                    if paper.get('publication_url'):
                        st.markdown(f"[Read More]({paper['publication_url']})")
                    st.markdown("---")

def show_stocks_page():
    st.header("📈 Stock Analysis")
    
    col1, col2 = st.columns([3, 1])
    
    with col2:
        st.subheader("Filters")
        field = st.selectbox("Field", ["All", "Technology", "Healthcare", "Finance", "Energy"])
        limit = st.slider("Number of stocks", 5, 50, 20)
    
    with col1:
        params = {"limit": limit}
        if field != "All":
            params["field"] = field
            
        stocks = fetch_api_data("/home/top-stocks", params)
        
        if stocks:
            stocks_df = pd.DataFrame(stocks)
            
            st.subheader(f"Top {len(stocks)} Stocks by Market Cap")
            
            # Create a bar chart
            fig = px.bar(
                stocks_df, 
                x='symbol', 
                y='market_cap',
                color='field',
                title='Market Capitalization by Stock'
            )
            st.plotly_chart(fig, use_container_width=True)
            
            # Display the data table
            st.subheader("Stock Details")
            st.dataframe(stocks_df, hide_index=True, use_container_width=True)

def show_authors_page():
    st.header("👥 Authors & Researchers")
    st.info("Author data endpoints will be implemented based on your database schema.")
    
    # Placeholder for author-related functionality
    st.write("Coming soon: Author profiles, publication networks, and collaboration analytics.")

def show_analytics_page():
    st.header("📊 Analytics Dashboard")
    st.info("Advanced analytics and visualizations coming soon!")
    
    # Placeholder for analytics
    st.write("This section will include:")
    st.write("- Stock performance trends")
    st.write("- Publication analytics")
    st.write("- Author collaboration networks")
    st.write("- Research impact metrics")

if __name__ == "__main__":
    main()