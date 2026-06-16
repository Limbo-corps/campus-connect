from django.core.management.base import BaseCommand
from django.utils.text import slugify

from campuses.models import Campus

CAMPUSES = [
    # ── IITs (23) ──────────────────────────────────────────────────
    {"name": "IIT Bombay",         "city": "Mumbai",            "state": "Maharashtra",      "description": "Indian Institute of Technology Bombay – premier tech institute, Mumbai."},
    {"name": "IIT Delhi",          "city": "New Delhi",         "state": "Delhi",             "description": "Indian Institute of Technology Delhi – top engineering college in the capital."},
    {"name": "IIT Madras",         "city": "Chennai",           "state": "Tamil Nadu",        "description": "Indian Institute of Technology Madras – consistently ranked #1 in India."},
    {"name": "IIT Kanpur",         "city": "Kanpur",            "state": "Uttar Pradesh",     "description": "Indian Institute of Technology Kanpur – pioneer in CS education in India."},
    {"name": "IIT Kharagpur",      "city": "Kharagpur",         "state": "West Bengal",       "description": "Indian Institute of Technology Kharagpur – the oldest IIT, est. 1951."},
    {"name": "IIT Roorkee",        "city": "Roorkee",           "state": "Uttarakhand",       "description": "Indian Institute of Technology Roorkee – oldest technical university in Asia."},
    {"name": "IIT Guwahati",       "city": "Guwahati",          "state": "Assam",             "description": "Indian Institute of Technology Guwahati – gateway to the Northeast."},
    {"name": "IIT Hyderabad",      "city": "Hyderabad",         "state": "Telangana",         "description": "Indian Institute of Technology Hyderabad – tech hub of South India."},
    {"name": "IIT Jodhpur",        "city": "Jodhpur",           "state": "Rajasthan",         "description": "Indian Institute of Technology Jodhpur – innovation in the blue city."},
    {"name": "IIT Patna",          "city": "Patna",             "state": "Bihar",             "description": "Indian Institute of Technology Patna – serving eastern India."},
    {"name": "IIT Ropar",          "city": "Rupnagar",          "state": "Punjab",            "description": "Indian Institute of Technology Ropar – growing campus in Punjab."},
    {"name": "IIT Bhubaneswar",    "city": "Bhubaneswar",       "state": "Odisha",            "description": "Indian Institute of Technology Bhubaneswar – temple city campus."},
    {"name": "IIT Gandhinagar",    "city": "Gandhinagar",       "state": "Gujarat",           "description": "Indian Institute of Technology Gandhinagar – known for liberal education."},
    {"name": "IIT Indore",         "city": "Indore",            "state": "Madhya Pradesh",    "description": "Indian Institute of Technology Indore – commercial capital of MP."},
    {"name": "IIT Mandi",          "city": "Mandi",             "state": "Himachal Pradesh",  "description": "Indian Institute of Technology Mandi – nestled in the Himalayas."},
    {"name": "IIT (BHU) Varanasi", "city": "Varanasi",          "state": "Uttar Pradesh",     "description": "IIT (BHU) Varanasi – located within Banaras Hindu University campus."},
    {"name": "IIT Tirupati",       "city": "Tirupati",          "state": "Andhra Pradesh",    "description": "Indian Institute of Technology Tirupati – new-gen IIT in AP."},
    {"name": "IIT Bhilai",         "city": "Bhilai",            "state": "Chhattisgarh",      "description": "Indian Institute of Technology Bhilai – steel city campus."},
    {"name": "IIT Goa",            "city": "Goa",               "state": "Goa",               "description": "Indian Institute of Technology Goa – beach-side engineering excellence."},
    {"name": "IIT Jammu",          "city": "Jammu",             "state": "Jammu & Kashmir",   "description": "Indian Institute of Technology Jammu – northern gateway campus."},
    {"name": "IIT Dharwad",        "city": "Dharwad",           "state": "Karnataka",         "description": "Indian Institute of Technology Dharwad – growing campus in Karnataka."},
    {"name": "IIT Palakkad",       "city": "Palakkad",          "state": "Kerala",            "description": "Indian Institute of Technology Palakkad – technology in God's Own Country."},
    {"name": "IIT (ISM) Dhanbad",  "city": "Dhanbad",           "state": "Jharkhand",         "description": "IIT (ISM) Dhanbad – specialises in mining, petroleum and applied sciences."},

    # ── NITs (31) ──────────────────────────────────────────────────
    {"name": "NIT Trichy",         "city": "Tiruchirappalli",   "state": "Tamil Nadu",        "description": "NIT Tiruchirappalli – consistently a top-5 NIT in India."},
    {"name": "NIT Warangal",       "city": "Warangal",          "state": "Telangana",         "description": "NIT Warangal – oldest and top-ranked NIT."},
    {"name": "NIT Surathkal",      "city": "Surathkal",         "state": "Karnataka",         "description": "NIT Surathkal – coastal Karnataka's premier engineering institute."},
    {"name": "NIT Calicut",        "city": "Kozhikode",         "state": "Kerala",            "description": "NIT Calicut – known for its lush campus and strong alumni network."},
    {"name": "NIT Rourkela",       "city": "Rourkela",          "state": "Odisha",            "description": "NIT Rourkela – steel city's top engineering college."},
    {"name": "NIT Jamshedpur",     "city": "Jamshedpur",        "state": "Jharkhand",         "description": "NIT Jamshedpur – engineering excellence in the steel capital."},
    {"name": "NIT Kurukshetra",    "city": "Kurukshetra",       "state": "Haryana",           "description": "NIT Kurukshetra – historic city, strong technical programs."},
    {"name": "NIT Durgapur",       "city": "Durgapur",          "state": "West Bengal",       "description": "NIT Durgapur – serving West Bengal with quality engineering education."},
    {"name": "VNIT Nagpur",        "city": "Nagpur",            "state": "Maharashtra",       "description": "Visvesvaraya NIT Nagpur – central India's top engineering college."},
    {"name": "MNNIT Allahabad",    "city": "Prayagraj",         "state": "Uttar Pradesh",     "description": "MNNIT Allahabad – historic institute on the banks of the Sangam."},
    {"name": "MANIT Bhopal",       "city": "Bhopal",            "state": "Madhya Pradesh",    "description": "MANIT Bhopal – NIT serving the heart of India."},
    {"name": "NIT Srinagar",       "city": "Srinagar",          "state": "Jammu & Kashmir",   "description": "NIT Srinagar – engineering education in the valley of Kashmir."},
    {"name": "NIT Hamirpur",       "city": "Hamirpur",          "state": "Himachal Pradesh",  "description": "NIT Hamirpur – hill-top campus in Himachal Pradesh."},
    {"name": "NIT Jalandhar",      "city": "Jalandhar",         "state": "Punjab",            "description": "NIT Jalandhar – Dr B.R. Ambedkar NIT serving Punjab."},
    {"name": "NIT Patna",          "city": "Patna",             "state": "Bihar",             "description": "NIT Patna – one of the oldest technical institutes of India."},
    {"name": "NIT Raipur",         "city": "Raipur",            "state": "Chhattisgarh",      "description": "NIT Raipur – quality engineering education in Chhattisgarh."},
    {"name": "NIT Agartala",       "city": "Agartala",          "state": "Tripura",           "description": "NIT Agartala – premier institute of the Northeast."},
    {"name": "NIT Silchar",        "city": "Silchar",           "state": "Assam",             "description": "NIT Silchar – serving the Barak Valley and Northeast India."},
    {"name": "NIT Meghalaya",      "city": "Shillong",          "state": "Meghalaya",         "description": "NIT Meghalaya – engineering in the Scotland of the East."},
    {"name": "NIT Manipur",        "city": "Imphal",            "state": "Manipur",           "description": "NIT Manipur – connecting the Northeast through technology."},
    {"name": "NIT Mizoram",        "city": "Aizawl",            "state": "Mizoram",           "description": "NIT Mizoram – growing institute in the Northeast."},
    {"name": "NIT Nagaland",       "city": "Dimapur",           "state": "Nagaland",          "description": "NIT Nagaland – technical education in the Northeast."},
    {"name": "NIT Arunachal",      "city": "Yupia",             "state": "Arunachal Pradesh", "description": "NIT Arunachal Pradesh – newest NIT serving the easternmost state."},
    {"name": "NIT Sikkim",         "city": "Ravangla",          "state": "Sikkim",            "description": "NIT Sikkim – technical excellence in the Himalayan state."},
    {"name": "NIT Puducherry",     "city": "Karaikal",          "state": "Puducherry",        "description": "NIT Puducherry – serving the Union Territory of Puducherry."},
    {"name": "NIT Goa",            "city": "Farmagudi",         "state": "Goa",               "description": "NIT Goa – engineering education in India's coastal paradise."},
    {"name": "NIT Delhi",          "city": "New Delhi",         "state": "Delhi",             "description": "NIT Delhi – capital city's National Institute of Technology."},
    {"name": "NIT Uttarakhand",    "city": "Srinagar",          "state": "Uttarakhand",       "description": "NIT Uttarakhand – situated in the Garhwal Himalayas."},
    {"name": "NIT Andhra Pradesh", "city": "Tadepalligudem",    "state": "Andhra Pradesh",    "description": "NIT Andhra Pradesh – newest NIT serving Andhra Pradesh."},
    {"name": "SVNIT Surat",        "city": "Surat",             "state": "Gujarat",           "description": "SVNIT Surat – Sardar Vallabhbhai NIT, diamond city of India."},
    {"name": "MNIT Jaipur",        "city": "Jaipur",            "state": "Rajasthan",         "description": "MNIT Jaipur – Malaviya NIT in the pink city of Rajasthan."},

    # ── IIITs ──────────────────────────────────────────────────────
    {"name": "IIIT Hyderabad",     "city": "Hyderabad",         "state": "Telangana",         "description": "IIIT Hyderabad – top-ranked IIIT, known for AI and language technology."},
    {"name": "IIIT Allahabad",     "city": "Prayagraj",         "state": "Uttar Pradesh",     "description": "IIIT Allahabad – oldest IIIT, strong industry connections."},
    {"name": "IIIT Bangalore",     "city": "Bengaluru",         "state": "Karnataka",         "description": "IIIT Bangalore – in the heart of India's Silicon Valley."},
    {"name": "IIIT Delhi",         "city": "New Delhi",         "state": "Delhi",             "description": "IIIT Delhi – autonomous IIIT with strong research programs."},
    {"name": "IIIT Guwahati",      "city": "Guwahati",          "state": "Assam",             "description": "IIIT Guwahati – information technology in Northeast India."},
    {"name": "IIITDM Jabalpur",    "city": "Jabalpur",          "state": "Madhya Pradesh",    "description": "IIITDM Jabalpur – design and manufacturing focus with IT core."},
    {"name": "IIITDM Kancheepuram","city": "Chennai",           "state": "Tamil Nadu",        "description": "IIITDM Kancheepuram – design and manufacturing in Tamil Nadu."},
    {"name": "IIIT Kota",          "city": "Kota",              "state": "Rajasthan",         "description": "IIIT Kota – IT education in India's coaching hub."},
    {"name": "IIIT Manipur",       "city": "Imphal",            "state": "Manipur",           "description": "IIIT Manipur – information technology in the Northeast."},
    {"name": "IIIT Nagpur",        "city": "Nagpur",            "state": "Maharashtra",       "description": "IIIT Nagpur – IT excellence in the Orange City."},
    {"name": "IIIT Pune",          "city": "Pune",              "state": "Maharashtra",       "description": "IIIT Pune – technology education in the Oxford of the East."},
    {"name": "IIIT Ranchi",        "city": "Ranchi",            "state": "Jharkhand",         "description": "IIIT Ranchi – IT education in the city of waterfalls."},
    {"name": "IIIT Sri City",      "city": "Chittoor",          "state": "Andhra Pradesh",    "description": "IIIT Sri City – IT hub in the integrated business city."},
    {"name": "IIIT Vadodara",      "city": "Vadodara",          "state": "Gujarat",           "description": "IIIT Vadodara – IT education in the cultural capital of Gujarat."},
    {"name": "IIIT Lucknow",       "city": "Lucknow",           "state": "Uttar Pradesh",     "description": "IIIT Lucknow – IT in the city of nawabs."},
    {"name": "IIIT Dharwad",       "city": "Dharwad",           "state": "Karnataka",         "description": "IIIT Dharwad – information technology in North Karnataka."},
    {"name": "IIIT Kalyani",       "city": "Kalyani",           "state": "West Bengal",       "description": "IIIT Kalyani – IT education near Kolkata."},
    {"name": "IIIT Una",           "city": "Una",               "state": "Himachal Pradesh",  "description": "IIIT Una – technology education in Himachal Pradesh."},
    {"name": "IIIT Kottayam",      "city": "Kottayam",          "state": "Kerala",            "description": "IIIT Kottayam – IT excellence in the land of rubber and spices."},
    {"name": "IIIT Bhagalpur",     "city": "Bhagalpur",         "state": "Bihar",             "description": "IIIT Bhagalpur – IT education in the Silk City."},
    {"name": "IIIT Bhopal",        "city": "Bhopal",            "state": "Madhya Pradesh",    "description": "IIIT Bhopal – technology education in the City of Lakes."},
    {"name": "IIIT Agartala",      "city": "Agartala",          "state": "Tripura",           "description": "IIIT Agartala – IT connectivity for Northeast India."},
    {"name": "IIIT Raichur",       "city": "Raichur",           "state": "Karnataka",         "description": "IIIT Raichur – emerging IT institute in North Karnataka."},
    {"name": "IIIT Surat",         "city": "Surat",             "state": "Gujarat",           "description": "IIIT Surat – IT in the fastest-growing city in India."},
    {"name": "IIIT Srirangam",     "city": "Tiruchirappalli",   "state": "Tamil Nadu",        "description": "IIIT Tiruchirappalli – IT education beside the famous Srirangam temple."},

    # ── IISc & IIST ────────────────────────────────────────────────
    {"name": "IISc Bangalore",     "city": "Bengaluru",         "state": "Karnataka",         "description": "Indian Institute of Science – India's premier research institute, est. 1909."},
    {"name": "IIST Thiruvananthapuram", "city": "Thiruvananthapuram", "state": "Kerala",       "description": "Indian Institute of Space Science and Technology – ISRO's space university."},

    # ── IISERs (7) ─────────────────────────────────────────────────
    {"name": "IISER Pune",         "city": "Pune",              "state": "Maharashtra",       "description": "IISER Pune – premier science research and education institute."},
    {"name": "IISER Kolkata",      "city": "Mohanpur",          "state": "West Bengal",       "description": "IISER Kolkata – science education and research in Mohanpur, near Kolkata."},
    {"name": "IISER Mohali",       "city": "Mohali",            "state": "Punjab",            "description": "IISER Mohali – integrated science research institute in Punjab."},
    {"name": "IISER Bhopal",       "city": "Bhopal",            "state": "Madhya Pradesh",    "description": "IISER Bhopal – science education and research in the City of Lakes."},
    {"name": "IISER Thiruvananthapuram", "city": "Thiruvananthapuram", "state": "Kerala",      "description": "IISER Thiruvananthapuram – science research in Kerala's capital."},
    {"name": "IISER Tirupati",     "city": "Tirupati",          "state": "Andhra Pradesh",    "description": "IISER Tirupati – new-generation science institute in AP."},
    {"name": "IISER Berhampur",    "city": "Berhampur",         "state": "Odisha",            "description": "IISER Berhampur – science education and research in Odisha."},
]


class Command(BaseCommand):
    help = "Seed IITs, NITs, and IIITs campus data"

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        for data in CAMPUSES:
            slug = slugify(data["name"])
            _, was_created = Campus.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": data["name"],
                    "city": data["city"],
                    "state": data["state"],
                    "description": data["description"],
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {created} campuses created, {skipped} already existed."
            )
        )
