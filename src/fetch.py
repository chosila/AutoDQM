import os, sys
import pycurl 
import StringIO 
import ast
import urllib2
import json
import datetime
from HTMLParser import HTMLParser
from urlparse import urljoin
import ROOT
from json import dumps

class DQMParser(HTMLParser):
    """
    parses pages with formatting like
    https://cmsweb.cern.ch/dqm/offline/data/browse/ROOT/OfflineData/Run2017/StreamExpress/0003019xx/
    >>> parser = DQMParser()
    >>> parser.feed(content)
    >>> pprint.pprint(parser.get_run_linktimestamps())
    """
        
    BASE_URL = "https://cmsweb.cern.ch"
    
    def __init__(self):
        HTMLParser.__init__(self)
        
        self.rows = []
        
        self.in_tr = False
        self.in_td = False
        self.in_a = False

        self.name = None
        self.link = None
        self.timestamp = None
    
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.in_tr = True
        elif tag == 'td':
            self.in_td = True
        elif tag == "a":
            self.in_a = True
            if self.in_tr and self.in_td:
                self.link = urljoin(self.BASE_URL, dict(attrs)["href"])

    def handle_data(self, data):
        if self.in_tr and self.in_td and self.in_a:
            self.name = data
        elif self.in_tr and self.in_td and "UTC" in data:
            self.timestamp = datetime.datetime.strptime(data.strip(), "%Y-%m-%d %H:%M:%S %Z")
    
    def handle_endtag(self, tag):
        if tag == 'tr':
            self.in_tr = False
            self.add_row()
        elif tag == 'td':
            self.in_td = False
        elif tag == "a":
            self.in_a = False

    def add_row(self):
        if self.name and self.link and self.timestamp:
            if self.name[-1] == '/': self.name = self.name[:-1]
            self.rows.append({"name": self.name, "url": self.link, "timestamp": self.timestamp})
            self.name = self.link = self.timestamp = None
        else: 
            raise Exception("Malformed row found, name: {0}, link: {1}, timestamp: {2}".format(self.name, self.link, self.timestamp))

    def get_rows(self):
        return self.rows


def hsv_to_rgb(h, s, v):
    if s == 0.0: v*=255; return [v, v, v]
    i = int(h*6.)
    f = (h*6.)-i; p,q,t = int(255*(v*(1.-s))), int(255*(v*(1.-s*f))), int(255*(v*(1.-s*(1.-f)))); v*=255; i%=6
    if i == 0: return [v, t, p]
    elif i == 1: return [q, v, p]
    elif i == 2: return [p, v, t]
    elif i == 3: return [p, q, v]
    elif i == 4: return [t, p, v]
    elif i == 5: return [v, p, q]

def get_cert_curl():
    c = pycurl.Curl()
    # cms voms member host certificate to authenticate adqm to cmsweb.cern.ch, defaults to voms-proxy-init certificate
    c.setopt(pycurl.SSLCERT, os.getenv('ADQM_SSLCERT'))
    # cms voms member host certificate key
    if 'ADQM_SSLKEY' in os.environ:
        c.setopt(pycurl.SSLKEY, os.getenv('ADQM_SSLKEY'))
    # cern root ca to verify cmsweb.cern.ch
    if 'ADQM_CERNCA' in os.environ:
        c.setopt(pycurl.CAINFO, os.getenv('ADQM_CERNCA'))
    return c

def get_url_with_cert(url):
    b = StringIO.StringIO() 
    c = get_cert_curl() 
    c.setopt(pycurl.WRITEFUNCTION, b.write) 
    c.setopt(pycurl.URL, url) 
    c.perform() 
    content = b.getvalue()
    return content

def get_file_with_cert(url, fname_out):
    c = get_cert_curl() 
    c.setopt(pycurl.URL, url)
    c.setopt(pycurl.FOLLOWLOCATION, 1)
    c.setopt(pycurl.NOPROGRESS, 1)
    c.setopt(pycurl.MAXREDIRS, 5)
    c.setopt(pycurl.NOSIGNAL, 1)
    with open(fname_out, "w") as fhout:
        c.setopt(c.WRITEFUNCTION, fhout.write)
        c.perform()

def clean_run_fname(fname):
    return fname.split('_')[2][4:]

def get_series():
    content = get_url_with_cert("https://cmsweb.cern.ch/dqm/offline/data/browse/ROOT/OfflineData/")
    parser = DQMParser()
    parser.feed(content)
    return parser.get_rows()

def get_samples(series):
    content = get_url_with_cert("https://cmsweb.cern.ch/dqm/offline/data/browse/ROOT/OfflineData/{0}/".format(series))
    parser = DQMParser()
    parser.feed(content)
    return parser.get_rows()

def get_runs(series, sample):
    content = get_url_with_cert("https://cmsweb.cern.ch/dqm/offline/data/browse/ROOT/OfflineData/{0}/{1}/".format(series, sample))
    parser = DQMParser()
    parser.feed(content)
    runDirs = parser.get_rows()
    runs = []
    for runDir in (get_url_with_cert(rD['url']) for rD in runDirs):
        parser = DQMParser()
        parser.feed(runDir)
        runs += parser.get_rows()
    for run in runs:
        run['name'] = clean_run_fname(run['name'])
    return runs

def fetch(series, sample, run):

    # Silence ROOT warnings
    ROOT.gROOT.SetBatch(ROOT.kTRUE)
    ROOT.gErrorIgnoreLevel = ROOT.kWarning

    # Path to directory containing all data
    db = os.getenv('ADQM_DB')
    if not os.path.exists(db):
        os.makedirs(db)

    # Get list of files already in database
    db_dir = "{0}/{1}/{2}".format(db, series, sample)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    dbase = os.listdir(db_dir)

    # Download file if not already in database
    if "{0}.root".format(run) not in dbase:
        runRows = get_runs(series, sample)
        for r in runRows:
            if str(run) == r["name"]:
                found = True
                get_file_with_cert(r["url"], "{0}/{1}.root".format(db_dir, run))

        if not found:
            return False, "Series: {0}, sample: {1}, run: {2} not found on offline DQM".format(series, sample, run)
        
        return True, None

    # Return if already in database
    else:
        return True, None


if __name__=='__main__':
    pass
    # fetch(run="301531", year="2017", sample="SingleMuon", targ_dir="")
    # print(get_runs(limit=5, year="2017", sample="SingleMuon"))
