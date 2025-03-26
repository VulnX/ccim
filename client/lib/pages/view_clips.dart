import 'package:ccim_client/main.dart';
import 'package:flutter/material.dart';

class ViewClipsPage extends StatelessWidget {
  const ViewClipsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MyScaffold(body: ViewClipsBody(), showFloatingActionButton: true,);
  }
}

class ViewClipsBody extends StatelessWidget {
  const ViewClipsBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(spacing: 40, children: [SearchBar(), Clips()]),
      ),
    );
  }
}

class Clips extends StatelessWidget {
  const Clips({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Card.outlined(
          margin: EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  spacing: 10,
                  children: [
                    Icon(Icons.arrow_forward_ios_rounded),
                    Text('Something here'),
                  ],
                ),
                Icon(Icons.public, color: Colors.black87),
              ],
            ),
          ),
        ),
        Card.outlined(
          margin: EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  spacing: 10,
                  children: [
                    Icon(Icons.arrow_forward_ios_rounded),
                    Text('Something private here'),
                  ],
                ),
                Icon(Icons.lock, color: Colors.black87),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class SearchBar extends StatelessWidget {
  const SearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: TextField(
          decoration: InputDecoration(
            hintText: 'Search clip',
            prefixIcon: Icon(Icons.search),
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
      ),
    );
  }
}
