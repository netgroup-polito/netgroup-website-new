import ssl
import re
import urllib.request
import json
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def extract_papers(user_id, owner_name):
    papers = []
    cstart = 0
    pagesize = 100
    
    while True:
        url = f"https://scholar.google.com/citations?user={user_id}&hl=en&cstart={cstart}&pagesize={pagesize}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        })
        try:
            with urllib.request.urlopen(req, context=ctx) as response:
                html = response.read().decode("utf-8")
        except Exception as e:
            print(f"Failed to fetch for {owner_name}: {e}")
            break

        rows = re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', html, flags=re.DOTALL)
        if not rows:
            break
            
        for row in rows:
            title_match = re.search(r'<a href="([^"]+)" class="gsc_a_at"[^>]*>(.*?)</a>', row)
            if not title_match: continue
            
            link = "https://scholar.google.com" + title_match.group(1).replace("&amp;", "&")
            title = title_match.group(2)
            
            div_matches = re.findall(r'<div class="gs_gray">(.*?)</div>', row)
            authors = div_matches[0] if len(div_matches) > 0 else ""
            venue = div_matches[1] if len(div_matches) > 1 else ""
            
            year_match = re.search(r'<span class="gsc_a_h gsc_a_hc gs_ibl">(.*?)</span>', row)
            year = year_match.group(1).strip() if year_match else ""
            
            # Clean HTML tags
            title = re.sub(r'<[^>]+>', '', title)
            authors = re.sub(r'<[^>]+>', '', authors)
            venue = re.sub(r'<span class="gs_oph">.*?</span>', '', venue, flags=re.DOTALL)
            venue = re.sub(r'<[^>]+>', '', venue)
            
            papers.append({
                "title": title.strip(),
                "authors": authors.strip(),
                "venue": venue.strip(),
                "year": year,
                "link": link
            })
            
        if len(rows) < pagesize:
            break
            
        cstart += pagesize
        time.sleep(1) # Prevent rate limiting between pages
        
    return papers

def main():
    try:
        with open("data/people.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("data/people.json not found")
        return

    papers_map = {}

    for cat in data.get("categories", []):
        for person in cat.get("people", []):
            for link in person.get("links", []):
                if link["text"] == "publications" and "user=" in link["url"]:
                    user_id_match = re.search(r'user=([^&]+)', link["url"])
                    if not user_id_match: continue
                    user_id = user_id_match.group(1)
                    
                    print(f"Fetching {person['name']} (User: {user_id})...")
                    papers = extract_papers(user_id, person["name"])
                    
                    added = 0
                    merged = 0
                    for p in papers:
                        phash = re.sub(r'[^a-z0-9]', '', p["title"].lower())
                        
                        if phash not in papers_map:
                            p["owners"] = [person["name"]]
                            papers_map[phash] = p
                            added += 1
                        else:
                            # Already exists, just append the new owner.
                            if person["name"] not in papers_map[phash]["owners"]:
                                papers_map[phash]["owners"].append(person["name"])
                            # In case a newer co-author scrape had a better year, update it
                            if not papers_map[phash]["year"] and p["year"]:
                                papers_map[phash]["year"] = p["year"]
                            merged += 1
                    
                    print(f"  -> Added {added} new unique papers, merged {merged} as co-authors.")
                    time.sleep(1.5) # Prevent rate limiting

    print(f"\nTotal unique papers extracted: {len(papers_map)}")
    
    # Sort papers by year descending
    all_papers = list(papers_map.values())
    
    def try_parse_year(y):
        try:
            return int(re.sub(r'\D', '', y))
        except:
            return 0
            
    all_papers.sort(key=lambda p: try_parse_year(p.get("year", "")), reverse=True)
    
    output_data = {
        "title": "Our Publications",
        "description": "Here you can explore the research output of the NetGroup members. Filter by author to see individual contributions, or view all to explore our entire output.",
        "papers": all_papers
    }
    
    with open("data/publications.json", "w") as f:
        json.dump(output_data, f, indent=2)

if __name__ == "__main__":
    main()
