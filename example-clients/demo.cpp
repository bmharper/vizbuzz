#include "../clients/vizbuzz.h"

/*

clang -o demo-cpp example-clients/demo.cpp -lstdc++ && ./demo-cpp

*/

int main(int argc, char** argv) {
	vizbuzz::File file;
	double        vertices[] = {4, 0, 3, 1, 2, 0};
	file.Add(vizbuzz::Polygon::XY(3, vertices));
	file.Save("example-data/demo-cpp.json");
	return 0;
}