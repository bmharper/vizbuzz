#ifndef VIZZBUZZ_H_INCLUDED
#define VIZZBUZZ_H_INCLUDED

#include <string>
#include <vector>

namespace vizbuzz {

class Vec3 {
public:
	double x = 0;
	double y = 0;
	double z = 0;
	Vec3(double _x, double _y, double _z = 0) : x(_x), y(_y), z(_z) {
	}
};

class Item {
public:
	virtual ~Item() {}
	virtual void Save(FILE* f) const = 0;
};

class Polygon : public Item {
public:
	std::vector<std::vector<Vec3>> Rings;

	// Create a polygon from a set of xy,xy,xy vertices
	// strideInT is specified in units of TScalar (not in byte)
	// If strideInT is not specified, it is assumed to be 2 (ie densely packed)
	template <typename TScalar>
	static Polygon XY(size_t nVertices, const TScalar* values, size_t strideInT = 0) {
		if (strideInT == 0)
			strideInT = 2;
		Polygon p;
		p.Rings.push_back({});
		for (size_t i = 0; i < nVertices; i++) {
			p.Rings[0].push_back(Vec3((double) values[0], (double) values[1]));
			values += strideInT;
		}
		return p;
	}

	virtual void Save(FILE* f) const override {
		fprintf(f, "\t\"polygon\": {\n");
		fprintf(f, "\t\t\"rings\": [\n");
		for (size_t i = 0; i < Rings.size(); i++) {
			const auto& ring = Rings[i];
			fprintf(f, "\t\t\t[");
			for (size_t j = 0; j < ring.size(); j++) {
				const auto& vx = ring[j];
				fprintf(f, "[%f,%f,%f]", vx.x, vx.y, vx.z);
				if (j != ring.size() - 1)
					fprintf(f, ",");
			}
			fprintf(f, "]");
			if (i != Rings.size() - 1)
				fprintf(f, ",");
			fprintf(f, "\n");
		}
		fprintf(f, "\t]}\n");
	}
};

// Create a File object, add items to it, then call Save()
class File {
public:
	std::vector<Item*> Items;

	~File() {
		Clear();
	}

	// Empty all items
	void Clear() {
		for (auto item : Items)
			delete item;
	}

	// Add a copy if 'item' to the file
	template <typename T>
	void Add(const T& item) {
		auto copy = new T;
		*copy     = item;
		Items.push_back(copy);
	}

	void Save(std::string filename) const {
		FILE* f = fopen(filename.c_str(), "wb");
		if (!f) {
			printf("vizbuzz: failed to write to %s\n", filename.c_str());
			return;
		}
		fprintf(f, "{\"items\":[\n");
		for (size_t i = 0; i < Items.size(); i++) {
			auto item = Items[i];
			fprintf(f, "\t{\n");
			item->Save(f);
			fprintf(f, "\t}");
			if (i != Items.size() - 1)
				fprintf(f, ",\n");
			else
				fprintf(f, "\n");
		}
		fprintf(f, "]}");
		fclose(f);
	}
};

} // namespace vizbuzz

#endif
