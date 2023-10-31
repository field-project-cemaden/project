import unidecode
import geopandas as gpd

# Read geojson file
geodf = gpd.read_file('../data/shapes.json')
geodf = geodf.rename(columns={'nomera': 'administrativeRegion'})
geodf = geodf[['administrativeRegion', 'geometry']]
geodf['administrativeRegion'] = geodf['administrativeRegion'].apply(lambda x: unidecode.unidecode(x.upper()))
