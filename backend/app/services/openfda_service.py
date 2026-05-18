import httpx

async def search_medicine(query: str):
    """
    Search for a medicine using the global OpenFDA API.
    Returns generic name, indications (uses), warnings, and dosage if found.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:\"{query}\"&limit=1"
            response = await client.get(url)
            
            if response.status_code != 200:
                # Fallback search by generic name
                url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:\"{query}\"&limit=1"
                response = await client.get(url)
                
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    result = data["results"][0]
                    return {
                        "found": True,
                        "brand_name": result.get("openfda", {}).get("brand_name", [query])[0],
                        "generic_name": result.get("openfda", {}).get("generic_name", ["Unknown"])[0],
                        "purpose": result.get("purpose", result.get("indications_and_usage", ["Information not provided."]))[0],
                        "warnings": result.get("warnings", ["No specific warnings provided."])[0],
                        "dosage_and_administration": result.get("dosage_and_administration", ["Refer to physician."])[0],
                        "active_ingredient": result.get("active_ingredient", ["Unknown"])[0]
                    }
            return {"found": False, "message": "Medicine not found in the global database."}
        except Exception as e:
            print(f"OpenFDA Error: {e}")
            return {"found": False, "message": f"Error accessing global database: {str(e)}"}
